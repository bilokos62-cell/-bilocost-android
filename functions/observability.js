"use strict";

const logger = require("firebase-functions/logger");
const crypto = require("node:crypto");

const SAFE_CODE = /^[a-zA-Z0-9_.:-]{1,80}$/;

function safeCode(value, fallback = "unknown") {
  const text = String(value || "");
  return SAFE_CODE.test(text) ? text : fallback;
}

function correlationId(value) {
  return SAFE_CODE.test(String(value || "")) ? String(value) : crypto.randomUUID();
}

/**
 * Emit structured, privacy-safe operational events.
 * Never pass message bodies, user profiles, tokens, OTPs, phone numbers,
 * email addresses, identity documents, or encryption keys in fields.
 */
function logEvent(severity, event, fields = {}) {
  const payload = {
    event: safeCode(event, "bilocost.event"),
    correlationId: correlationId(fields.correlationId),
    ...(fields.functionName ? { functionName: safeCode(fields.functionName) } : {}),
    ...(fields.status ? { status: safeCode(fields.status) } : {}),
    ...(Number.isFinite(fields.durationMs) ? { durationMs: Math.max(0, Math.round(fields.durationMs)) } : {}),
    ...(fields.errorCode ? { errorCode: safeCode(fields.errorCode) } : {}),
    ...(fields.region ? { region: safeCode(fields.region) } : {}),
  };

  const write = logger[severity] || logger.info;
  write(payload.event, payload);
  return payload.correlationId;
}

function logError(event, error, fields = {}) {
  const code = error && typeof error.code === "string" ? error.code : "internal";
  return logEvent("error", event, {
    ...fields,
    errorCode: safeCode(code, "internal"),
    status: "error",
  });
}

module.exports = { logEvent, logError };
