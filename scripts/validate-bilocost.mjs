import { readFileSync } from "node:fs";
import vm from "node:vm";

const file = "index.html";
const html = readFileSync(file, "utf8");
const firestoreRules = readFileSync("firestore.rules", "utf8");
const storageRules = readFileSync("storage.rules", "utf8");
const firebaseConfig = JSON.parse(readFileSync("firebase.json", "utf8"));
const firestoreIndexes = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
const messagingPatch = readFileSync("messaging-fix.js", "utf8");
const servicePatch = readFileSync("service-design.js", "utf8");
const uiRefinementPatch = readFileSync("ui-refinement.js", "utf8");
const deliveryPatch = readFileSync("delivery-otp.js", "utf8");
const geographyPatch = readFileSync("geography-selector.js", "utf8");
const listingLocationPatch = readFileSync("listing-location.js", "utf8");
const themeRewards = readFileSync("theme-rewards.js", "utf8");
const themeSettingsEntry = readFileSync("theme-settings-entry.js", "utf8");
const themeDesigns = readFileSync("personalization-designs.js", "utf8");
try { new vm.Script(themeDesigns, { filename: "personalization-designs.js" }); } catch (error) { fail("Design personalization syntax error: " + error.message); }
for (const [name, code] of [["messaging-fix.js", messagingPatch], ["service-design.js", servicePatch], ["ui-refinement.js", uiRefinementPatch], ["theme-rewards.js", themeRewards], ["theme-settings-entry.js", themeSettingsEntry], ["delivery-otp.js", deliveryPatch], ["geography-selector.js", geographyPatch], ["listing-location.js", listingLocationPatch]]) {
  try { new vm.Script(code, { filename: name }); } catch (error) { fail(name + " syntax error: " + error.message); }
}
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

try { new vm.Script(deliveryPatch, { filename: "delivery-otp.js" }); } catch (error) { fail("Delivery OTP patch syntax error: " + error.message); }
try { new vm.Script(geographyPatch, { filename: "geography-selector.js" }); } catch (error) { fail("Geography selector syntax error: " + error.message); }
try { new vm.Script(themeRewards, { filename: "theme-rewards.js" }); } catch (error) { fail("Theme rewards syntax error: " + error.message); }
try { new vm.Script(themeSettingsEntry, { filename: "theme-settings-entry.js" }); } catch (error) { fail("Theme settings entry syntax error: " + error.message); }
if (!themeSettingsEntry.includes("biloOpenThemeCustomizer") || !themeRewards.includes("window.biloOpenThemeCustomizer")) fail("Theme palette settings entry is not connected");
try { new vm.Script(functionsSource, { filename: "functions/index.js" }); } catch (error) { fail("Cloud Functions syntax error: " + error.message); }
if (firebaseConfig.functions?.source !== "functions") fail("Cloud Functions source is not configured in firebase.json");
if (!firestoreRules.includes("match /orders/{orderId}") || !firestoreRules.includes("match /deliveryCodes/{orderId}")) fail("Secure order and delivery-code rules are missing");
if (!functionsSource.includes("exports.createDeliveryOrder") || !functionsSource.includes("exports.confirmDelivery") || !functionsSource.includes("exports.confirmOrderPayment")) fail("Delivery OTP backend functions are incomplete");
if (!firestoreIndexes.indexes.some(index => index.collectionGroup === "orders" && index.fields.some(field => field.fieldPath === "buyerId") && index.fields.some(field => field.fieldPath === "createdAt"))) fail("Buyer order-history index is missing");
if (!firestoreIndexes.indexes.some(index => index.collectionGroup === "orders" && index.fields.some(field => field.fieldPath === "sellerId") && index.fields.some(field => field.fieldPath === "createdAt"))) fail("Seller order-history index is missing");

if (!/index\s*=\s*1/.test(themeRewards) || !/index\s*>=\s*100/.test(themeRewards)) fail("The 100-color palette generator is incomplete");
if (!/ACCESS_DURATION_MS\s*=\s*30\s*\*/.test(themeRewards) || !/state\.progress\[id\]\s*>=\s*2/.test(themeRewards)) fail("Premium color unlock must require two rewarded ads and last 30 days");
if (!/const DAYS=30\*86400000/.test(themeDesigns) || !/state\.progress\[id\]>=2/.test(themeDesigns)) fail("Premium design unlock must require two rewarded ads and last 30 days");
if (!themeDesigns.includes("window.biloOpenPersonalizationHub") || !themeSettingsEntry.includes("biloOpenPersonalizationHub")) fail("The colors-and-designs personalization hub is not connected");
const platformWorkflows = [
  [".github/workflows/android.yml", readFileSync(".github/workflows/android.yml", "utf8")],
  [".github/workflows/ios.yml", readFileSync(".github/workflows/ios.yml", "utf8")],
  [".github/workflows/firebase-hosting.yml", readFileSync(".github/workflows/firebase-hosting.yml", "utf8")],
];
for (const [path, workflow] of platformWorkflows) {
  if (!workflow.includes("personalization-designs.js")) fail(path + " does not inject premium design personalization");
  if (!workflow.includes("theme-rewards.js")) fail(path + " does not inject the rewarded color palettes");
}

console.log("Delivery OTP module and backend syntax: valid.");
console.log("Bilocost source validation passed.");
console.log("JavaScript syntax: valid");
console.log("Core integrations detected: " + checks.length);
if (/gemini|aiModel|improveListingWithAI/i.test(html)) fail("Optional AI integration is still present");
console.log("Optional AI integration: removed.");
console.log("Note: this validates source structure only; it does not prove live Firebase, payment, escrow, or device behavior.");
