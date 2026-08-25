const fs = require("node:fs");
const vm = require("node:vm");

const test = fs.readFileSync("test-card.js", "utf8").split(/\r?\n/);
const implementation = fs.readFileSync("weather-solar-card.js", "utf8");
const source = [
  "const require = globalThis.__weatherSolarCardTestRequire;",
  ...test.slice(0, 21),
  implementation,
  ...test.slice(21),
].join("\n");

globalThis.__weatherSolarCardTestRequire = require;
vm.runInThisContext(source, { filename: "weather-solar-card.test.js" });
