import resolve from "@rollup/plugin-node-resolve";

const config =  {
  input: "build/es6/antity-pgsql.js",
  output: {
    name: "antity-pgsql",
    file: "build/antity-pgsql.cjs.js",
    format: "cjs"
  },
  external: [
  ],
  plugins: [
    resolve(),
  ]
};

export default config;