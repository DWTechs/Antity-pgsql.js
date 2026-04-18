
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

export default config;
