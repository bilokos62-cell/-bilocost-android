import { readFileSync } from "node:fs";
import vm from "node:vm";

const file = "index.html";
const html = readFileSync(file, "utf8");
const firestoreRules = readFileSync("firestore.rules", "utf8");
const storageRules = readFileSync("storage.rules", "utf8");
const firebaseConfig = JSON.parse(readFileSync("firebase.json", "utf8"));
const firestoreIndexes = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
const functionsSource = readFileSync("functions/index.js", "utf8");

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
];

for (const [label, pattern] of checks) {
  if (!pattern.test(html)) fail(label + " is missing");
}

if (firebaseConfig.firestore?.rules !== "firestore.rules") fail("Firestore rules are not configured in firebase.json");
if (firebaseConfig.storage?.rules !== "storage.rules") fail("Storage rules are not configured in firebase.json");
if (firebaseConfig.firestore?.indexes !== "firestore.indexes.json") fail("Firestore indexes are not configured in firebase.json");
if (!firestoreIndexes.indexes.some(index => index.collectionGroup === "walletTransactions" && index.fields.some(field => field.fieldPath === "ownerId") && index.fields.some(field => field.fieldPath === "createdAt"))) fail("Wallet transaction composite index is missing");
if (!firestoreRules.includes("match /{document=**}") || !firestoreRules.includes("allow read, write: if false")) fail("Firestore default-deny rule is missing");
if (!firestoreRules.includes("match /chats/{chatId}") || !firestoreRules.includes("match /identity_verifications/{uid}")) fail("Critical Firestore access rules are missing");
if (!storageRules.includes("match /private_identity/{uid}/{fileName}") || !storageRules.includes("allow read: if isOwner(uid) || isAdmin()")) fail("Private identity Storage rules are missing");

try {
  new vm.Script(functionsSource, { filename: "functions/index.js" });
} catch (error) {
  fail("Cloud Functions JavaScript syntax error: " + error.message);
}

const functionChecks = [
  ["Buyer delivery-code callable", /exports\\.getBuyerDeliveryCode\\s*=\\s*onCall/],
  ["Seller delivery confirmation callable", /exports\\.confirmDeliveryCode\\s*=\\s*onCall/],
  ["Five-attempt OTP limit", /MAX_ATTEMPTS\\s*=\\s*5/],
  ["Server-side delivery status", /status:\\s*"DELIVERED"/],
  ["No automatic escrow release", /fundsReleased:\\s*false/],
];
for (const [label, pattern] of functionChecks) {
  if (!pattern.test(functionsSource)) fail(label + " is missing");
}
if (firebaseConfig.functions?.source !== "functions" || firebaseConfig.functions?.runtime !== "nodejs22") {
  fail("Firebase Functions source or Node.js runtime is not configured");
}
if (!firestoreRules.includes("match /secureOrders/{orderId}") ||
    !firestoreRules.includes("match /userInbox/{uid}/messages/{messageId}") ||
    !firestoreRules.includes("allow create, update, delete: if false")) {
  fail("Secure orders or private inbox rules are missing");
}

console.log("Bilocost source validation passed.");
console.log("JavaScript syntax: valid");
console.log("Core integrations detected: " + checks.length);
if (/gemini|aiModel|improveListingWithAI/i.test(html)) fail("Optional AI integration is still present");
console.log("Optional AI integration: removed.");
console.log("Note: this validates source structure only; it does not prove live Firebase, payment, escrow, or device behavior.");
