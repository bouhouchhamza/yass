import { spawn, spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
const base = process.env.BASE_URL ?? "http://localhost:8787",
  candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ],
  browser = candidates.find(existsSync);
if (!browser) throw new Error("Chrome/Edge headless introuvable");
const profile = join(process.cwd(), ".wrangler", "browser-smoke-profile");
rmSync(profile, { recursive: true, force: true });
let passed = 0,
  failed = 0;
function test(name, fn) {
  try {
    awaitMaybe(fn());
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}: ${e.message}`);
  }
}
function awaitMaybe(v) {
  if (v && typeof v.then === "function")
    throw new Error("Utilisez testAsync pour une assertion asynchrone");
  return v;
}
async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}: ${e.message}`);
  }
}
function page(path) {
  const r = spawnSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${profile}`,
      "--dump-dom",
      base + path,
    ],
    { encoding: "utf8", timeout: 30000, windowsHide: true },
  );
  if (r.status !== 0) throw new Error(r.stderr || `browser exit ${r.status}`);
  return r.stdout;
}
test("page de connexion", () => {
  if (!/connexion|connecter|e-mail/i.test(page("/login")))
    throw new Error("formulaire absent");
});
test("dashboard redirigé vers connexion", () => {
  if (!/connexion|connecter|e-mail/i.test(page("/dashboard")))
    throw new Error("redirection absente");
});
test("admin redirigé vers connexion", () => {
  if (!/connexion|connecter|e-mail/i.test(page("/dashboard/admin")))
    throw new Error("redirection absente");
});
test("page PWA hors ligne", () => {
  if (!/hors ligne|connexion/i.test(page("/offline")))
    throw new Error("page absente");
});
const exportResponse = await fetch(base + "/api/export/products", {
  redirect: "manual",
});
test("export protégé", () => {
  if (exportResponse.status !== 403)
    throw new Error(`HTTP ${exportResponse.status}`);
});
async function cdpChecks() {
  const email = process.env.SMOKE_EMAIL,
    password = process.env.SMOKE_PASSWORD,
    register = process.env.SMOKE_REGISTER_ID;
  if (!email || !password || !register) return;
  const login = await fetch(base + "/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({ email, password }),
  });
  if (!login.ok) throw new Error(`connexion smoke HTTP ${login.status}`);
  const setCookie = login.headers.get("set-cookie");
  if (!setCookie) throw new Error("cookie de session absent");
  const cookie = setCookie.match(/^([^=]+)=([^;]+)/);
  if (!cookie) throw new Error("cookie illisible");
  const debugPort = 9333,
    proc = spawn(
      browser,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        `--user-data-dir=${profile}-cdp`,
        `--remote-debugging-port=${debugPort}`,
        "about:blank",
      ],
      { windowsHide: true, stdio: "ignore" },
    );
  try {
    let version;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try {
        version = await fetch(
          `http://127.0.0.1:${debugPort}/json/version`,
        ).then((r) => r.json());
        break;
      } catch {}
    }
    if (!version) throw new Error("CDP indisponible");
    const ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    let seq = 0;
    const pending = new Map();
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    const send = (method, params = {}, sessionId) =>
      new Promise((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { resolve, reject });
        ws.send(
          JSON.stringify({
            id,
            method,
            params,
            ...(sessionId ? { sessionId } : {}),
          }),
        );
      });
    const { targetId } = await send("Target.createTarget", {
        url: "about:blank",
      }),
      { sessionId } = await send("Target.attachToTarget", {
        targetId,
        flatten: true,
      });
    await send("Network.enable", {}, sessionId);
    await send(
      "Network.setCookie",
      { name: cookie[1], value: cookie[2], url: base },
      sessionId,
    );
    await send("Page.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);
    await send(
      "Page.addScriptToEvaluateOnNewDocument",
      {
        source: `window.__trackStops=0;const track={stop(){window.__trackStops++},getSettings(){return{}},readyState:'live'};Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[track],getVideoTracks:()=>[track]}),enumerateDevices:async()=>[]}});HTMLMediaElement.prototype.play=async function(){};`,
      },
      sessionId,
    );
    const navigate = async (url) => {
        await send("Page.navigate", { url: base + url }, sessionId);
        await new Promise((r) => setTimeout(r, 2500));
      },
      evaluate = async (expression) =>
        (
          await send(
            "Runtime.evaluate",
            { expression, returnByValue: true, awaitPromise: true },
            sessionId,
          )
        ).result.value;
    await navigate(`/dashboard/registers/${register}/closing-report`);
    await testAsync("bouton d’impression de clôture", async () => {
      const ok = await evaluate(
        `(()=>{window.print=()=>window.__printed=true;const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Imprimer A4'));if(!b)return false;b.click();return window.__printed===true})()`,
      );
      if (!ok) throw new Error("bouton ou appel window.print absent");
    });
    await navigate("/dashboard/pos");
    await testAsync("libération caméra à la fermeture", async () => {
      const opened = await evaluate(
        `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Caméra'));if(!b)return false;b.click();return true})()`,
      );
      if (!opened) throw new Error("bouton caméra absent");
      await new Promise((r) => setTimeout(r, 1500));
      const closed = await evaluate(
        `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Fermer'));if(!b)return false;b.click();return true})()`,
      );
      if (!closed) throw new Error("modal scanner absent");
      await new Promise((r) => setTimeout(r, 500));
      const stops = await evaluate("window.__trackStops");
      if (!(stops > 0)) throw new Error(`pistes arrêtées: ${stops}`);
    });
    ws.close();
  } finally {
    proc.kill();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    rmSync(`${profile}-cdp`, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 200,
    });
  }
}
await cdpChecks();
rmSync(profile, { recursive: true, force: true });
console.log(`\nBrowser smoke: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
