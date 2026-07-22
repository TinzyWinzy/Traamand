"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onApplicantAudit = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const helpers_1 = require("./helpers");
exports.onApplicantAudit = (0, firestore_1.onDocumentUpdated)({ document: 'applicants/{applicantId}' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    await (0, helpers_1.writeAuditLog)('applicant', event.params.applicantId, before, after);
});
