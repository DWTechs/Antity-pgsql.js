
const config =  {
  input: "build/es6/antity-pgsql.js",
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
