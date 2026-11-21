#!/usr/bin/env node
"use strict";

// Run only from a trusted workstation with Firebase Admin credentials (ADC).
// Never expose this script through an HTTP/callable function or commit credentials.
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

async function main() {
  const email = process.argv[2];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: node scripts/set-admin-claim.js admin@example.com");
  }
  initializeApp({ credential: applicationDefault(), projectId: "bilocost-a8136" });
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  const claims = { ...(user.customClaims || {}), admin: true, superadmin: true };
  await auth.setCustomUserClaims(user.uid, claims);
  console.log("Rôle administrateur attribué à :", user.email, "(UID :", user.uid + ")");
  console.log("Déconnectez/reconnectez ce compte pour renouveler son jeton Firebase.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
