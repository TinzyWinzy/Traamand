"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
exports.clearRateLimit = clearRateLimit;
const attempts = new Map();
function checkRateLimit(key, maxAttempts, windowMs) {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || now > entry.resetAt) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (entry.count >= maxAttempts)
        return false;
    entry.count++;
    return true;
}
function clearRateLimit(key) {
    attempts.delete(key);
}
