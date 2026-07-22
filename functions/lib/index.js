"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLocationStats = exports.generateWorkerSEO = exports.onApplicantAudit = exports.onBookingCompleted = exports.onApplicantConverted = exports.onUserCreated = exports.sendReplacementAlert = exports.onBookingAuditAndAvailability = exports.scheduleCheckIns = exports.sendBookingConfirmation = exports.matchWorkerToBooking = exports.payoutCallback = exports.processPayout = exports.paynowCallback = exports.pollPaynowPayment = exports.processPaynowPayment = exports.initializeAdminUsers = exports.verifyAdminAccess = exports.setUserRole = exports.prerender = exports.sitemap = void 0;
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
admin.initializeApp();
(0, v2_1.setGlobalOptions)({ region: 'us-central1' });
var sitemap_1 = require("./sitemap");
Object.defineProperty(exports, "sitemap", { enumerable: true, get: function () { return sitemap_1.sitemap; } });
var prerender_1 = require("./prerender");
Object.defineProperty(exports, "prerender", { enumerable: true, get: function () { return prerender_1.prerender; } });
var admin_1 = require("./admin");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return admin_1.setUserRole; } });
Object.defineProperty(exports, "verifyAdminAccess", { enumerable: true, get: function () { return admin_1.verifyAdminAccess; } });
Object.defineProperty(exports, "initializeAdminUsers", { enumerable: true, get: function () { return admin_1.initializeAdminUsers; } });
var paynow_1 = require("./paynow");
Object.defineProperty(exports, "processPaynowPayment", { enumerable: true, get: function () { return paynow_1.processPaynowPayment; } });
Object.defineProperty(exports, "pollPaynowPayment", { enumerable: true, get: function () { return paynow_1.pollPaynowPayment; } });
Object.defineProperty(exports, "paynowCallback", { enumerable: true, get: function () { return paynow_1.paynowCallback; } });
Object.defineProperty(exports, "processPayout", { enumerable: true, get: function () { return paynow_1.processPayout; } });
Object.defineProperty(exports, "payoutCallback", { enumerable: true, get: function () { return paynow_1.payoutCallback; } });
var bookings_1 = require("./bookings");
Object.defineProperty(exports, "matchWorkerToBooking", { enumerable: true, get: function () { return bookings_1.matchWorkerToBooking; } });
Object.defineProperty(exports, "sendBookingConfirmation", { enumerable: true, get: function () { return bookings_1.sendBookingConfirmation; } });
Object.defineProperty(exports, "scheduleCheckIns", { enumerable: true, get: function () { return bookings_1.scheduleCheckIns; } });
Object.defineProperty(exports, "onBookingAuditAndAvailability", { enumerable: true, get: function () { return bookings_1.onBookingAuditAndAvailability; } });
Object.defineProperty(exports, "sendReplacementAlert", { enumerable: true, get: function () { return bookings_1.sendReplacementAlert; } });
var referrals_1 = require("./referrals");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return referrals_1.onUserCreated; } });
Object.defineProperty(exports, "onApplicantConverted", { enumerable: true, get: function () { return referrals_1.onApplicantConverted; } });
Object.defineProperty(exports, "onBookingCompleted", { enumerable: true, get: function () { return referrals_1.onBookingCompleted; } });
var audit_1 = require("./audit");
Object.defineProperty(exports, "onApplicantAudit", { enumerable: true, get: function () { return audit_1.onApplicantAudit; } });
var seo_1 = require("./seo");
Object.defineProperty(exports, "generateWorkerSEO", { enumerable: true, get: function () { return seo_1.generateWorkerSEO; } });
Object.defineProperty(exports, "updateLocationStats", { enumerable: true, get: function () { return seo_1.updateLocationStats; } });
