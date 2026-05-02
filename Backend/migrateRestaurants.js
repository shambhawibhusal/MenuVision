const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateRestaurants() {
    console.log('Starting restaurant migration...\n');

    const restaurantMap = new Map();

    console.log('Step 1: Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users\n`);

    console.log('Step 2: Processing user history...');
    let totalHistoryItems = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const history = userData.history || [];
        totalHistoryItems += history.length;

        for (const item of history) {
            const place = item.place;
            const location = item.location;
            const dateStr = item.date;

            if (!place) continue;

            const key = `${place}_${location || ''}`;

            if (!restaurantMap.has(key)) {
                restaurantMap.set(key, {
                    name: place,
                    location: location || '',
                    dates: [],
                    totalScans: 0
                });
            }

            const restaurant = restaurantMap.get(key);
            restaurant.dates.push(dateStr);
            restaurant.totalScans++;
        }
    }

    console.log(`Processed ${totalHistoryItems} history items\n`);
    console.log(`Found ${restaurantMap.size} unique restaurants\n`);

    console.log('Step 3: Creating restaurant documents...');

    for (const [key, data] of restaurantMap) {
        const dates = data.dates.sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA - dateB;
        });

        const restaurantData = {
            name: data.name,
            location: data.location,
            firstScanned: dates[0],
            lastScanned: dates[dates.length - 1],
            totalScans: data.totalScans,
            averageRating: 0,
            totalReviews: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('restaurants').doc(key).set(restaurantData, { merge: true });
        console.log(`  Created: ${data.name} (${data.location}) - ${data.totalScans} scans`);
    }

    console.log('\n=== Migration Complete! ===');
    console.log(`Created ${restaurantMap.size} restaurant documents`);

    process.exit(0);
}

migrateRestaurants().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});