
import dts from "rollup-plugin-dts";

const config =  {
  input: "build/es6/antity-pgsql.js",
  onwarn(warning, warn) {
    if (warning.code === "THIS_IS_UNDEFINED") return;
    warn(warning);
  },
  output: {
    name: "antity-pgsql",
    file: "build/antity-pgsql.mjs",
    format: "es"
  },
  external: [
    "@dwtechs/checkard", "@dwtechs/winstan"
  ],
  plugins: []
};

// Bundles the per-file .d.ts output tsc already generates in build/es6/ into a
// single declaration file matching the single bundled antity-pgsql.mjs above —
// tree-shaken down to only what antity-pgsql.ts's entry point re-exports.
const dtsConfig = {
  input: "build/es6/antity-pgsql.d.ts",
  output: {
    file: "build/antity-pgsql.d.ts",
    format: "es"
  },
  external: [
    "express", "@dwtechs/antity"
  ],
  plugins: [dts()]
};

export default [config, dtsConfig];
