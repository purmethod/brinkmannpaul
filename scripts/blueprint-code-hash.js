// Makes the fingerprint for a new free blueprint code (see dist/api/blueprint-code.js).
// The code is read from stdin so it never lands in a file or the shell history:
//   read -s CODE; printf %s "$CODE" | node scripts/blueprint-code-hash.js; unset CODE
// Add the printed "salt.hash" to BLUEPRINT_CODE_HASHES in the Vercel project brinkmannpaul (comma separated, sensitive).
// Never write the code itself into this repo, a commit, an issue or a pull request.
const { makeHash } = require("../dist/api/blueprint-code");

let code = "";
process.stdin.on("data", (d) => { code += d; });
process.stdin.on("end", () => {
  if (!code.trim()) {
    console.error("no code on stdin");
    process.exit(1);
  }
  console.log(makeHash(code));
});
