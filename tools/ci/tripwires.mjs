/* Runs `node tools/verify/cdp.mjs modes` and fails when its tripwires move.

     SITE_ROOT=OUT node tools/ci/tripwires.mjs

   `modes` only prints the numbers (document.body.innerText.length in each
   render mode), which is right for a person reading them and useless as a
   gate. This holds them against tools/ci/tripwires.json. A stray `-->` once
   turned 642 characters of notes into page text with nothing visible in a
   screenshot; a jump like that fails here. Runs differ by a character or two
   (2402 vs 2403 on the same build), hence the tolerance.

   When a change moves the text on purpose, run `modes`, put the new numbers in
   tripwires.json and in HANDOFF.md's tripwire paragraph, in the same commit. */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const want = JSON.parse(readFileSync(here("./tripwires.json"), "utf8"));
const r = spawnSync(process.execPath, [here("../verify/cdp.mjs"), "modes"], { encoding: "utf8", env: process.env, timeout: 180000 });
process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");

const problems = [];
if (r.status !== 0) problems.push(`cdp.mjs modes exited ${r.status ?? r.signal}`);
const m = /tripwires: (\{[\s\S]*?\n\})/.exec(r.stdout || "");
if (!m) problems.push("no tripwires in the output");
else {
  const got = JSON.parse(m[1]);
  if (got.boardLive !== true) problems.push(`the board did not go live at 1440x900 (boardLive ${got.boardLive})`);
  for (const [k, v] of Object.entries(want.lengths)) {
    if (typeof got[k] !== "number" || Math.abs(got[k] - v) > want.tolerance)
      problems.push(`${k}: ${got[k]} characters, expected ${v} +/- ${want.tolerance}`);
  }
}
if (/^console:/m.test(r.stdout || "")) problems.push("the page logged errors or warnings (printed above)");

for (const p of problems) console.error("FAIL " + p);
process.exitCode = problems.length ? 1 : 0;
if (!problems.length) console.log("ok: tripwires");
