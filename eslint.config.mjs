import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([...nextVitals, ...nextTs, {
  rules: {
    "react-hooks/purity": "off",
    "react-hooks/refs": "off",
    "react-hooks/preserve-manual-memoization": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
}, globalIgnores([".next/**", ".open-next/**", ".wrangler/**", "worker-configuration.d.ts"])]);
