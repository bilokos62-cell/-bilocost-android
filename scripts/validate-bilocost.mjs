import { readFileSync } from "node:fs";
import vm from "node:vm";

const file = "index.html";
const html = readFileSync(file, "utf8");
const firestoreRules = readFileSync("firestore.rules", "utf8");
const storageRules = readFileSync("storage.rules", "utf8");
const firebaseConfig = JSON.parse(readFileSync("firebase.json", "utf8"));
const firestoreIndexes = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
const deliveryPatch = readFileSync("delivery-otp.js", "utf8");
const messagingPatch = readFileSync("messaging-fix.js", "utf8");
const serviceDesign = readFileSync("service-design.js", "utf8");
const uiRefinement = readFileSync("ui-refinement.js", "utf8");
const geographyPatch = readFileSync("geography-selector.js", "utf8");
const listingLocationPatch = readFileSync("listing-location.js", "utf8");
const themeRewards = readFileSync("theme-rewards.js", "utf8");
const themeSettingsEntry = readFileSync("theme-settings-entry.js", "utf8");
const functionsSource = readFileSync("functions/index.js", "utf8");
const androidWorkflow = readFileSync(".github/workflows/android.yml", "utf8");
const iosWorkflow = readFileSync(".github/workflows/ios.yml", "utf8");
const hostingWorkflow = readFileSync(".github/workflows/firebase-hosting.yml", "utf8");
const functionsWorkflow = readFileSync(".github/workflows/firebase-functions.yml", "utf8");

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

if (!html.includes('loading="lazy" decoding="async" fetchpriority="low"')) fail("Listing and category images must lazy-load asynchronously");

for (const [label, pattern] of checks) {
  if (!pattern.test(html)) fail(label + " is missing");
}

if (firebaseConfig.firestore?.rules !== "firestore.rules") fail("Firestore rules are not configured in firebase.json");
if (firebaseConfig.storage?.rules !== "storage.rules") fail("Storage rules are not configured in firebase.json");
if (firebaseConfig.firestore?.indexes !== "firestore.indexes.json") fail("Firestore indexes are not configured in firebase.json");
if (!firestoreIndexes.indexes.some(index => index.collectionGroup === "walletTransactions" && index.fields.some(field => field.fieldPath === "ownerId") && index.fields.some(field => field.fieldPath === "createdAt"))) fail("Wallet transaction composite index is missing");
if (!firestoreRules.includes("match /{document=**}") || !firestoreRules.includes("allow read, write: if false")) fail("Firestore default-deny rule is missing");
if (!firestoreRules.includes("match /chats/{chatId}") || !firestoreRules.includes("match /identity_verifications/{uid}")) fail("Critical Firestore access rules are missing");
if (!firestoreRules.includes('resource.data.status == "pending" && request.resource.data.status == "active"')) fail("Seller moderation bypass protection is missing");
if (!firestoreRules.includes("request.resource.data.province is string") || !firestoreRules.includes("request.resource.data.locality is string")) fail("Listing province and locality requirements are missing from Firestore rules");
if (!storageRules.includes("match /private_identity/{uid}/{fileName}") || !storageRules.includes("allow read: if isOwner(uid) || isAdmin()")) fail("Private identity Storage rules are missing");

try { new vm.Script(deliveryPatch, { filename: "delivery-otp.js" }); } catch (error) { fail("Delivery OTP patch syntax error: " + error.message); }
try { new vm.Script(messagingPatch, { filename: "messaging-fix.js" }); } catch (error) { fail("Messaging patch syntax error: " + error.message); }
try { new vm.Script(serviceDesign, { filename: "service-design.js" }); } catch (error) { fail("Service design syntax error: " + error.message); }
try { new vm.Script(uiRefinement, { filename: "ui-refinement.js" }); } catch (error) { fail("UI refinement syntax error: " + error.message); }
try { new vm.Script(listingLocationPatch, { filename: "listing-location.js" }); } catch (error) { fail("Listing location patch syntax error: " + error.message); }
if (!listingLocationPatch.includes("form.province=loc.province") || !listingLocationPatch.includes("form.locality=loc.commune") || !listingLocationPatch.includes("Choisissez votre province et votre localité avant de publier")) fail("Listing publication no longer enforces province and locality");
for (const [platform, workflow] of [["Android", androidWorkflow], ["iOS", iosWorkflow], ["Firebase Hosting", hostingWorkflow]]) {
  if (!workflow.includes("listing-location.js")) fail(platform + " build does not inject the mandatory listing location module");
}
if (!listingLocationPatch.includes("form.locality=loc.commune||loc.territory||loc.neighborhood||")) fail("Listing publication must preserve a valid fallback locality");
if (!listingLocationPatch.includes("(item.locality||item.commune||item.c)!==loc.commune")) fail("Listing filters must remain compatible with older locality fields");
if (!hostingWorkflow.includes("firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project bilocost-a8136")) fail("Firebase deployment must include the reviewed security rules and indexes");
if (!functionsWorkflow.includes("node-version: 22") || !functionsWorkflow.includes("firebase deploy --only functions --project bilocost-a8136")) fail("Cloud Functions deployment workflow is incomplete");
if (!geographyPatch.includes('state.province=provinces.find(x=>getId(x)===id)||null;state.territory=null;state.local=null;state.manual=""')) fail("Changing province must clear the previous locality");

try { new vm.Script(geographyPatch, { filename: "geography-selector.js" }); } catch (error) { fail("Geography selector syntax error: " + error.message); }
try { new vm.Script(themeRewards, { filename: "theme-rewards.js" }); } catch (error) { fail("Theme rewards syntax error: " + error.message); }
try { new vm.Script(themeSettingsEntry, { filename: "theme-settings-entry.js" }); } catch (error) { fail("Theme settings entry syntax error: " + error.message); }
if (!themeSettingsEntry.includes("biloOpenThemeCustomizer") || !themeRewards.includes("window.biloOpenThemeCustomizer")) fail("Theme palette settings entry is not connected");
try { new vm.Script(functionsSource, { filename: "functions/index.js" }); } catch (error) { fail("Cloud Functions syntax error: " + error.message); }
if (firebaseConfig.functions?.source !== "functions") fail("Cloud Functions source is not configured in firebase.json");
if (firebaseConfig.functions?.runtime !== "nodejs22") fail("Cloud Functions must use the supported Node.js 22 runtime");
if (!firestoreRules.includes("match /orders/{orderId}") || !firestoreRules.includes("match /deliveryCodes/{orderId}")) fail("Secure order and delivery-code rules are missing");
if (!functionsSource.includes("exports.createDeliveryOrder") || !functionsSource.includes("exports.confirmDelivery") || !functionsSource.includes("exports.confirmOrderPayment")) fail("Delivery OTP backend functions are incomplete");
if (!firestoreIndexes.indexes.some(index => index.collectionGroup === "orders" && index.fields.some(field => field.fieldPath === "buyerId") && index.fields.some(field => field.fieldPath === "createdAt"))) fail("Buyer order-history index is missing");
if (!firestoreIndexes.indexes.some(index => index.collectionGroup === "orders" && index.fields.some(field => field.fieldPath === "sellerId") && index.fields.some(field => field.fieldPath === "createdAt"))) fail("Seller order-history index is missing");
console.log("Delivery OTP module and backend syntax: valid.");
console.log("Bilocost source validation passed.");
console.log("JavaScript syntax: valid");
console.log("Core integrations detected: " + checks.length);
if (/gemini|aiModel|improveListingWithAI/i.test(html)) fail("Optional AI integration is still present");
console.log("Optional AI integration: removed.");
console.log("Note: this validates source structure only; it does not prove live Firebase, payment, escrow, or device behavior.");
