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
exports.dailyFirestoreExport = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
exports.dailyFirestoreExport = (0, scheduler_1.onSchedule)({ schedule: '0 2 * * *', timeZone: 'Africa/Harare', maxInstances: 1 }, async () => {
    const projectId = process.env.GCLOUD_PROJECT || 'studio-8895863664-52c12';
    const bucketName = `${projectId}-backups`;
    const client = new admin.firestore.v1.FirestoreAdminClient();
    const databaseName = `projects/${projectId}/databases/(default)`;
    try {
        const responses = await client.exportDocuments({
            name: databaseName,
            outputUriPrefix: `gs://${bucketName}/firestore-export`,
            collectionIds: [],
        });
        const response = responses[0];
        console.log(`Backup started: ${response.name}`);
    }
    catch (err) {
        console.error('Backup failed:', err);
    }
});
