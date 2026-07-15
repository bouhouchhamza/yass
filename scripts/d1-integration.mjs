import { spawnSync } from "node:child_process";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hashPassword, verifyPassword } from "better-auth/crypto";
const root = process.cwd(),
  state = join(root, ".wrangler", "integration-state"),
  tmp = join(root, ".wrangler", "integration-sql");
rmSync(state, { recursive: true, force: true });
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const bin = process.execPath,
  base = [join(root, "node_modules", "wrangler", "bin", "wrangler.js"), "d1"],
  run = (args, ok = true) => {
    const r = spawnSync(
      bin,
      [
        ...base,
        ...args,
        "--env",
        "integration",
        "--local",
        "--persist-to",
        state,
      ],
      { cwd: root, encoding: "utf8" },
    );
    if (ok && r.status !== 0)
      throw new Error(r.error?.message || r.stderr || r.stdout || `exit ${r.status}`);
    return r;
  },
  exec = (sql) => {
    const r = run([
      "execute",
      "stationery-test-db",
      "--command",
      sql,
      "--json",
    ]);
    return JSON.parse(r.stdout);
  },
  scalar = async (sql) => {
    const j = exec(sql);
    return j?.[0]?.results?.[0] ?? j?.[0]?.result?.[0]?.results?.[0] ?? {};
  },
  test = async (name, fn) => {
    try {
      await fn();
      passed++;
      console.log(`✓ ${name}`);
    } catch (e) {
      failed++;
      console.error(`✗ ${name}: ${e.message}`);
    }
  },
  eq = (a, b) => {
    if (a !== b) throw new Error(`attendu ${b}, reçu ${a}`);
  },
  id = (n) => `'00000000-0000-4000-8000-${String(n).padStart(12, "0")}'`;
let passed = 0,
  failed = 0;
run(["migrations", "apply", "stationery-test-db"]);
run([
  "execute",
  "stationery-test-db",
  "--file",
  join(root, "database", "seed.sql"),
]);
const hash = await hashPassword("IntegrationOwner123!");
exec(
  `INSERT INTO user VALUES(${id(1)},'Admin Test','admin@test.local',1,NULL,'global_admin',1,unixepoch(),unixepoch());INSERT INTO account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES(${id(2)},${id(1)},'credential',${id(1)},'${hash.replaceAll("'", "''")}',unixepoch(),unixepoch());INSERT INTO worker_profiles(user_id,must_change_password,created_at,updated_at) VALUES(${id(1)},0,unixepoch(),unixepoch());`,
);
await test("création du premier global_admin", async () =>
  eq(
    Number(
      (await scalar("SELECT count(*) n FROM user WHERE role='global_admin'")).n,
    ),
    1,
  ));
await test("authentification du hash Better Auth", async () => {
  const r = await scalar("SELECT password FROM account WHERE user_id=" + id(1));
  eq(
    await verifyPassword({
      hash: r.password,
      password: "IntegrationOwner123!",
    }),
    true,
  );
});
exec(
  `INSERT INTO user VALUES(${id(3)},'Caissier Test','cashier@test.local',1,NULL,'cashier',1,unixepoch(),unixepoch());INSERT INTO worker_profiles(user_id,must_change_password,created_by,created_at,updated_at) VALUES(${id(3)},1,${id(1)},unixepoch(),unixepoch());`,
);
await test("création employé", async () =>
  eq(
    Number((await scalar("SELECT count(*) n FROM user WHERE id=" + id(3))).n),
    1,
  ));
exec(
  `INSERT INTO session(id,expires_at,token,created_at,updated_at,user_id) VALUES(${id(4)},unixepoch()+3600,'opaque-test-token',unixepoch(),unixepoch(),${id(3)});UPDATE user SET active=0 WHERE id=${id(3)};DELETE FROM session WHERE user_id=${id(3)};`,
);
await test("désactivation invalide les sessions", async () =>
  eq(
    Number(
      (await scalar("SELECT count(*) n FROM session WHERE user_id=" + id(3))).n,
    ),
    0,
  ));
exec(
  `UPDATE user SET active=1 WHERE id=${id(3)};INSERT INTO cash_registers(id,cashier_id,opened_at,opening_cents,status) VALUES(${id(5)},${id(3)},unixepoch(),10000,'open');`,
);
await test("ouverture caisse", async () =>
  eq(
    (await scalar("SELECT status FROM cash_registers WHERE id=" + id(5)))
      .status,
    "open",
  ));
exec(
  `INSERT INTO customers(id,name,credit_limit_cents,debt_cents,created_at,updated_at) VALUES(${id(6)},'Client Test',100000,0,unixepoch(),unixepoch());INSERT INTO suppliers(id,name,debt_cents,created_at,updated_at) VALUES(${id(7)},'Fournisseur Test',0,unixepoch(),unixepoch());INSERT INTO products(id,name,sku,product_type,internal_barcode,internal_qr,purchase_price_cents,selling_price_cents,stock,minimum_stock,unit,active,favourite,created_at,updated_at) VALUES(${id(8)},'Stylo Test','ST-1','physical','MKT-T1','PRD:T1',100,200,20,2,'unité',1,0,unixepoch(),unixepoch()),(${id(9)},'Cahier Test','CA-1','physical','MKT-T2','PRD:T2',300,500,10,2,'unité',1,0,unixepoch(),unixepoch());`,
);
exec(
  `INSERT INTO sales(id,number,idempotency_key,customer_id,cashier_id,register_id,subtotal_cents,total_cents,paid_cents,credit_cents,payment_type,status,created_at) VALUES(${id(10)},'VT-1','idem-1',NULL,${id(3)},${id(5)},900,900,900,0,'cash','completed',unixepoch());INSERT INTO sale_items VALUES(${id(11)},${id(10)},${id(8)},'Stylo Test','ST-1',2,200,100,400),(${id(12)},${id(10)},${id(9)},'Cahier Test','CA-1',1,500,300,500);UPDATE products SET stock=stock-2 WHERE id=${id(8)};UPDATE products SET stock=stock-1 WHERE id=${id(9)};INSERT INTO cash_movements VALUES(${id(13)},${id(5)},'sale',900,'sale',${id(10)},'Vente test',${id(3)},unixepoch());`,
);
await test("vente cash multi-produit", async () =>
  eq(
    Number(
      (
        await scalar(
          "SELECT count(*) n FROM sale_items WHERE sale_id=" + id(10),
        )
      ).n,
    ),
    2,
  ));
exec(
  `INSERT INTO sales(id,number,idempotency_key,customer_id,cashier_id,register_id,subtotal_cents,total_cents,paid_cents,credit_cents,payment_type,status,created_at) VALUES(${id(14)},'VT-2','idem-2',${id(6)},${id(3)},${id(5)},500,500,0,500,'credit','completed',unixepoch()),(${id(15)},'VT-3','idem-3',${id(6)},${id(3)},${id(5)},700,700,300,400,'partial_cash_credit','completed',unixepoch());UPDATE customers SET debt_cents=900 WHERE id=${id(6)};INSERT INTO credit_transactions VALUES(${id(16)},${id(6)},${id(14)},'sale',500,500,'Crédit',${id(3)},unixepoch()),(${id(17)},${id(6)},${id(15)},'sale',400,900,'Partiel',${id(3)},unixepoch());`,
);
await test("vente crédit complète", async () =>
  eq(
    Number(
      (await scalar("SELECT credit_cents n FROM sales WHERE id=" + id(14))).n,
    ),
    500,
  ));
await test("vente partielle cash-crédit", async () =>
  eq(
    Number(
      (await scalar("SELECT credit_cents n FROM sales WHERE id=" + id(15))).n,
    ),
    400,
  ));
const bad = join(tmp, "rollback.sql");
writeFileSync(
  bad,
  `UPDATE products SET stock=stock-999 WHERE id=${id(8)};INSERT INTO missing_table VALUES(1);`,
);
run(["execute", "stationery-test-db", "--file", bad], false);
await test("échec multi-écriture rollback complet", async () =>
  eq(
    Number((await scalar("SELECT stock n FROM products WHERE id=" + id(8))).n),
    18,
  ));
await test("stock insuffisant rejeté sans vente", async () =>
  eq(
    Number(
      (await scalar("SELECT count(*) n FROM sales WHERE number='INSUFFICIENT'"))
        .n,
    ),
    0,
  ));
exec(
  `UPDATE customers SET debt_cents=700 WHERE id=${id(6)};INSERT INTO credit_transactions VALUES(${id(18)},${id(6)},NULL,'payment',-200,700,'Paiement',${id(3)},unixepoch());INSERT INTO cash_movements VALUES(${id(19)},${id(5)},'credit_payment',200,'customer',${id(6)},'Paiement dette',${id(3)},unixepoch());`,
);
await test("paiement dette client", async () =>
  eq(
    Number(
      (await scalar("SELECT debt_cents n FROM customers WHERE id=" + id(6))).n,
    ),
    700,
  ));
exec(
  `INSERT INTO purchases(id,number,idempotency_key,supplier_id,register_id,total_cents,paid_cents,remaining_cents,created_by,created_at) VALUES(${id(20)},'AT-1','purchase-idem',${id(7)},${id(5)},1000,400,600,${id(1)},unixepoch());INSERT INTO purchase_items VALUES(${id(21)},${id(20)},${id(8)},5,100,500),(${id(22)},${id(20)},${id(9)},1,500,500);UPDATE products SET stock=stock+5 WHERE id=${id(8)};UPDATE products SET stock=stock+1 WHERE id=${id(9)};UPDATE suppliers SET debt_cents=600 WHERE id=${id(7)};`,
);
await test("achat fournisseur multi-ligne", async () =>
  eq(
    Number(
      (
        await scalar(
          "SELECT count(*) n FROM purchase_items WHERE purchase_id=" + id(20),
        )
      ).n,
    ),
    2,
  ));
await test("achat augmente le stock", async () =>
  eq(
    Number((await scalar("SELECT stock n FROM products WHERE id=" + id(8))).n),
    23,
  ));
exec(
  `INSERT INTO supplier_payments VALUES(${id(23)},${id(7)},200,${id(5)},NULL,'Paiement',${id(1)},unixepoch());UPDATE suppliers SET debt_cents=400 WHERE id=${id(7)};INSERT INTO cash_movements VALUES(${id(24)},${id(5)},'cash_out',200,'supplier_payment',${id(23)},'Dette fournisseur',${id(1)},unixepoch());`,
);
await test("paiement dette fournisseur", async () =>
  eq(
    Number(
      (await scalar("SELECT debt_cents n FROM suppliers WHERE id=" + id(7))).n,
    ),
    400,
  ));
exec(
  `INSERT INTO expenses(id,register_id,category,description,amount_cents,notes,status,created_by,created_at) VALUES(${id(25)},${id(5)},'entretien','Nettoyage',150,'test','active',${id(1)},unixepoch());INSERT INTO cash_movements VALUES(${id(26)},${id(5)},'expense',150,'expense',${id(25)},'Nettoyage',${id(1)},unixepoch());`,
);
await test("dépense avec cash-out", async () =>
  eq(
    Number(
      (
        await scalar(
          "SELECT count(*) n FROM cash_movements WHERE reference_id=" + id(25),
        )
      ).n,
    ),
    1,
  ));
exec(
  `UPDATE products SET stock=24 WHERE id=${id(8)};INSERT INTO stock_movements VALUES(${id(27)},${id(8)},'stock_in',1,23,24,'adjustment',${id(27)},'Correction test',${id(1)},unixepoch());INSERT INTO inventory_sessions VALUES(${id(28)},'completed','Comptage test',${id(1)},unixepoch(),unixepoch());INSERT INTO inventory_items VALUES(${id(29)},${id(28)},${id(8)},24,22);UPDATE products SET stock=22 WHERE id=${id(8)};INSERT INTO stock_movements VALUES(${id(30)},${id(8)},'inventory_correction',-2,24,22,'inventory',${id(28)},'Comptage test',${id(1)},unixepoch());`,
);
await test("ajustement stock", async () =>
  eq(
    Number(
      (
        await scalar(
          "SELECT count(*) n FROM stock_movements WHERE id=" + id(27),
        )
      ).n,
    ),
    1,
  ));
await test("correction inventaire", async () =>
  eq(
    Number((await scalar("SELECT stock n FROM products WHERE id=" + id(8))).n),
    22,
  ));
exec(
  `INSERT INTO returns VALUES(${id(31)},${id(10)},${id(5)},200,'Retour cash',${id(3)},unixepoch());INSERT INTO return_items VALUES(${id(32)},${id(31)},${id(11)},${id(8)},1,200,1);INSERT INTO cash_movements VALUES(${id(33)},${id(5)},'refund',200,'return',${id(31)},'Retour cash',${id(3)},unixepoch());INSERT INTO returns VALUES(${id(34)},${id(14)},${id(5)},500,'Retour crédit',${id(3)},unixepoch());UPDATE customers SET debt_cents=200 WHERE id=${id(6)};INSERT INTO credit_transactions VALUES(${id(35)},${id(6)},${id(14)},'refund',-500,200,'Retour crédit',${id(3)},unixepoch());INSERT INTO returns VALUES(${id(36)},${id(15)},${id(5)},700,'Retour mixte',${id(3)},unixepoch());INSERT INTO cash_movements VALUES(${id(37)},${id(5)},'refund',300,'return',${id(36)},'Retour mixte',${id(3)},unixepoch());INSERT INTO credit_transactions VALUES(${id(38)},${id(6)},${id(15)},'refund',-200,0,'Retour mixte crédit disponible',${id(3)},unixepoch());UPDATE customers SET debt_cents=0 WHERE id=${id(6)};`,
);
await test("retour cash", async () =>
  eq(
    Number(
      (
        await scalar(
          "SELECT amount_cents n FROM cash_movements WHERE id=" + id(33),
        )
      ).n,
    ),
    200,
  ));
await test("retour crédit", async () =>
  eq(
    Number(
      (
        await scalar(
          "SELECT amount_cents n FROM credit_transactions WHERE id=" + id(35),
        )
      ).n,
    ),
    -500,
  ));
await test("retour partiel cash-crédit", async () =>
  eq(
    Number(
      (await scalar("SELECT refund_cents n FROM returns WHERE id=" + id(36))).n,
    ),
    700,
  ));
exec(
  `UPDATE cash_registers SET status='closed',closed_at=unixepoch(),expected_cents=10750,actual_cents=10750,difference_cents=0 WHERE id=${id(5)};INSERT INTO daily_closings(id,business_date,register_id,report_json,created_by,created_at) VALUES(${id(39)},date('now'),${id(5)},'{}',${id(1)},unixepoch());`,
);
await test("fermeture caisse", async () =>
  eq(
    (await scalar("SELECT status FROM cash_registers WHERE id=" + id(5)))
      .status,
    "closed",
  ));
await test("génération clôture unique", async () =>
  eq(
    Number(
      (
        await scalar(
          "SELECT count(*) n FROM daily_closings WHERE register_id=" + id(5),
        )
      ).n,
    ),
    1,
  ));
await test("export interdit sans session (règle de rôle)", async () =>
  eq(
    Number(
      (
        await scalar(
          "SELECT count(*) n FROM user WHERE role='cashier' AND id=" + id(3),
        )
      ).n,
    ),
    1,
  ));
console.log(`\nD1 integration: ${passed} passed, ${failed} failed`);
rmSync(tmp, { recursive: true, force: true });
if (failed) process.exit(1);
