import { readFileSync } from "node:fs";
import vm from "node:vm";

const file = "index.html";
const html = readFileSync(file, "utf8");
const pwaManifest = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
const serviceWorker = readFileSync("sw.js", "utf8");
const pwaIcon = readFileSync("icons/icon.svg", "utf8");
const firestoreRules = readFileSync("firestore.rules", "utf8");
const storageRules = readFileSync("storage.rules", "utf8");
const firebaseConfig = JSON.parse(readFileSync("firebase.json", "utf8"));
const firestoreIndexes = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
const deliveryPatch = readFileSync("delivery-otp.js", "utf8");
const geographyPatch = readFileSync("geography-selector.js", "utf8");
const iosHigPatch = readFileSync("ios-hig.js", "utf8");
const messagingPatch = readFileSync("messaging-fix.js", "utf8");
const servicePatch = readFileSync("service-design.js", "utf8");
const uiRefinementPatch = readFileSync("ui-refinement.js", "utf8");
const listingLocationPatch = readFileSync("listing-location.js", "utf8");
const iosWorkflow = readFileSync(".github/workflows/ios.yml", "utf8");
const androidWorkflow = readFileSync(".github/workflows/android.yml", "utf8");
const firebaseWorkflow = readFileSync(".github/workflows/firebase-hosting.yml", "utf8");
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


if (pwaManifest.start_url !== "/" || pwaManifest.scope !== "/") fail("PWA manifest start URL or scope is invalid");
if (!pwaManifest.icons?.some(icon => icon.src === "/icons/icon.svg" && icon.type === "image/svg+xml")) fail("PWA SVG icon is missing from manifest");
if (!pwaIcon.includes("<svg") || !pwaIcon.includes("#009a49")) fail("Bilocost PWA icon is invalid");
if (!serviceWorker.includes("self.skipWaiting") || !serviceWorker.includes("self.clients.claim")) fail("PWA service worker lifecycle handlers are missing");
if (!html.includes("navigator.serviceWorker.register") || !html.includes("/sw.js")) fail("Root-scoped service worker registration is missing");
if (html.includes("BILO_APPCHECK_SITE_KEY") || html.includes("initializeAppCheck") || html.includes("firebase-app-check")) fail("Unregistered Firebase App Check client is still initialized");
if (!firebaseWorkflow.includes("cp sw.js www/sw.js") || !firebaseWorkflow.includes("cp manifest.webmanifest www/manifest.webmanifest") || !firebaseWorkflow.includes("cp icons/icon.svg www/icons/icon.svg")) fail("Firebase Hosting workflow does not package required PWA assets");

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
try { new vm.Script(iosHigPatch, { filename: "ios-hig.js" }); } catch (error) { fail("iOS HIG patch syntax error: " + error.message); }
try { new vm.Script(servicePatch, { filename: "service-design.js" }); } catch (error) { fail("Service design patch syntax error: " + error.message); }
try { new vm.Script(messagingPatch, { filename: "messaging-fix.js" }); } catch (error) { fail("Messaging patch syntax error: " + error.message); }
try { new vm.Script(uiRefinementPatch, { filename: "ui-refinement.js" }); } catch (error) { fail("UI refinement patch syntax error: " + error.message); }
const assembledModules = [messagingPatch, servicePatch, deliveryPatch, geographyPatch, uiRefinementPatch].join("\n");
try { new vm.Script(assembledModules, { filename: "assembled-bilocost-modules.js" }); } catch (error) { fail("Combined injected modules syntax error: " + error.message); }
console.log("All injected modules and combined bundle syntax: valid.");
console.log("iOS HIG accessibility patch syntax: valid.");
try { new vm.Script(functionsSource, { filename: "functions/index.js" }); } catch (error) { fail("Cloud Functions syntax error: " + error.message); }
if (firebaseConfig.functions?.source !== "functions") fail("Cloud Functions source is not configured in firebase.json");
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
