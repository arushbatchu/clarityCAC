// build-standalone.mjs
// Bundles the compiled TypeScript (public/js) into ONE html file that works
// when double-clicked, with no server. Browsers block ES modules on file://,
// so we inline every module into a single script in dependency order.
//
// Usage: npm run standalone   ->  dist/clarity-standalone.html

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const ORDER = ["rules.generated", "types", "engine", "i18n", "api", "ui", "pwa", "main"];
const js = (name) => readFileSync(new URL(`../public/js/${name}.js`, import.meta.url), "utf-8");

function flatten(code) {
    const aliases = [];
    code = code.replace(/^import\s*\{([^}]*)\}\s*from\s*["'][^"']+["'];?\s*$/gm, (_, names) => {
        for (const part of names.split(",")) {
            const m = part.trim().match(/^(\w+)\s+as\s+(\w+)$/);
            if (m) aliases.push(`const ${m[2]} = ${m[1]};`);
        }
        return "";
    });
    code = code.replace(/^export\s*\{[^}]*\}\s*from\s*["'][^"']+["'];?\s*$/gm, "");
    code = code.replace(/^export\s+(?=(async\s+)?(function|const|let|class)\b)/gm, "");
    return aliases.join("\n") + "\n" + code;
}

const bundle = ORDER.map(n => `// ── ${n}.ts ──\n${flatten(js(n))}`).join("\n");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf-8")
    .replace(/<script type="module" src="js\/main\.js"><\/script>/,
        `<script>\n(() => {\n"use strict";\n${bundle}\n})();\n</script>`)
    .replace(/<link rel="manifest"[^>]*>\n?/, "");

mkdirSync(new URL("../dist/", import.meta.url), { recursive: true });
writeFileSync(new URL("../dist/clarity-standalone.html", import.meta.url), html);
console.log("wrote dist/clarity-standalone.html");
