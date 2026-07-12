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
exports.sitemap = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
function firestore() { return admin.firestore(); }
const BASE_URL = 'https://traamand.co.zw';
async function generateSitemap() {
    const urls = [];
    urls.push(`  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`);
    const categoriesSnap = await firestore().collection('categories').orderBy('sortOrder', 'asc').get();
    categoriesSnap.docs.forEach((doc) => {
        const cat = doc.data();
        urls.push(`  <url><loc>${BASE_URL}/hire/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`);
    });
    const workersSnap = await firestore()
        .collection('workers')
        .where('isActive', '==', true)
        .get();
    workersSnap.docs.forEach((doc) => {
        const w = doc.data();
        urls.push(`  <url><loc>${BASE_URL}/worker/${w.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    });
    const locationPagesSnap = await firestore().collection('locationPages').get();
    locationPagesSnap.docs.forEach((doc) => {
        urls.push(`  <url><loc>${BASE_URL}/hire/${doc.data().serviceType?.toLowerCase()}/${doc.data().city?.toLowerCase()}/${doc.data().suburb?.toLowerCase()}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
    });
    urls.push(`  <url><loc>${BASE_URL}/available-staff</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`);
    urls.push(`  <url><loc>${BASE_URL}/find-a-maid</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
    urls.push(`  <url><loc>${BASE_URL}/join-our-team</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}
exports.sitemap = (0, https_1.onRequest)({ region: 'us-central1' }, async (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    try {
        const xml = await generateSitemap();
        res.send(xml);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Sitemap generation failed');
    }
});
