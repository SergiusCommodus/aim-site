// Minifies the CSS and JS the build hands it on stdin: {"css":[...],"js":[...]} -> same shape, minified.
// Needs `npm install` once (terser and csso). build.py falls back to unminified output if this fails.
const { minify } = require("terser"), csso = require("csso");
let input = ""; process.stdin.on("data", d => input += d).on("end", async () => {
  const j = JSON.parse(input), out = { css: [], js: [] };
  for (const c of j.css) out.css.push(csso.minify(c, { restructure: false }).css);
  for (const s of j.js) { const r = await minify(s, { compress: { passes: 2 }, mangle: true, format: { comments: false } }); out.js.push(r.code); }
  process.stdout.write(JSON.stringify(out));
});
