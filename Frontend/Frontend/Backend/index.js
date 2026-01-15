const express = require('express');
const app = express();
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.get('/test-firestore', async (req, res) => {
    try {
        const docRef = db.collection('testCollection').doc('testDoc');
        await docRef.set({ message: 'Hello from Firestore', createdAt: new Date() });
        const snap = await docRef.get();
        res.json(snap.data());
    } catch (err) {
        console.error(err);
        res.status(500).send('Firestore error');
    }
});

const PORT = 5000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend is working');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
