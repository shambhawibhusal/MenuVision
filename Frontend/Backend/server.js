const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const Tesseract = require('tesseract.js');
require('dotenv').config();

admin.initializeApp();

const app = express();
app.use(cors());
app.use(express.json());

// Helper functions
function parseMenuText(text) {
    return text.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => ({ name: line, price: '', type: '' }));
}

async function enrichMenuItems(items) {
    // optional: add more info (price, category, etc.)
    return items;
}

// OCR endpoint
app.post('/analyzeMenu', async (req, res) => {
    try {
        const { imageUrl, userId } = req.body;

        // OCR with Tesseract
        const { data: { text } } = await Tesseract.recognize(
            imageUrl,
            'eng',
            { logger: m => console.log(m) }
        );

        const menuItems = parseMenuText(text);
        const enrichedItems = await enrichMenuItems(menuItems);

        // Save to Firestore
        const scanRef = admin.firestore().collection('menuScans').doc();
        await scanRef.set({
            userId,
            imageUrl,
            rawText: text,
            menuItems: enrichedItems,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });

        res.json({ success: true, scanId: scanRef.id, menuItems: enrichedItems });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(5000, () => console.log("✅ Backend running on http://localhost:5000"));
