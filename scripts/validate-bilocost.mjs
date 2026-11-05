import { readFileSync } from "node:fs";
import vm from "node:vm";

const file = "index.html";
const html = readFileSync(file, "utf8");

function fail(message) {
  console.error("Bilocost validation failed: " + message);
  process.exit(1);
}

const appMarker = html.indexOf("const CLOUD=");
if (appMarker < 0) fail("main application script marker not found");

const scriptStart = html.lastIndexOf("<script", appMarker);
const tagEnd = html.indexOf(">", scriptStart);
const scriptEnd = html.indexOf("</script>", appMarker);
if (scriptStart < 0 || tagEnd < 0 || scriptEnd < 0) {
  fail("main application script boundaries are incomplete");
}

const source = html.slice(tagEnd + 1, scriptEnd);
try {
  new vm.Script(source, { filename: file });
} catch (error) {
  fail("JavaScript syntax error: " + error.message);
}

const checks = [
  ["Firebase configuration", /window\.BILO_FIREBASE\s*=\s*\{/],
  ["Firebase initialization", /async function initFirebase\s*\(/],
  ["Firebase Authentication", /createUserWithEmailAndPassword|signInWithEmailAndPassword/],
  ["Firestore listing storage", /collection\(FB\.db,\s*["']items["']/],
  ["Bilocost messaging", /async function postMsg\s*\(/],
  ["Phone-number moderation", /function containsPhoneNumber\s*\(/],
  ["Rental module", /function rentHome\s*\(/],
  ["Gemini integration", /gemini-2\.5-flash/],
  ["AI listing helper", /improveListingWithAI/],
];

for (const [label, pattern] of checks) {
  if (!pattern.test(html)) fail(label + " is missing");
}

console.log("Bilocost source validation passed.");
console.log("JavaScript syntax: valid");
console.log("Core integrations detected: " + checks.length);
console.log("Note: this validates source structure only; it does not prove live Firebase, payment, escrow, or device behavior.");
