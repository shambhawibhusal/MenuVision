const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateDishesToRestaurants() {
    console.log('Starting dish migration (arrayUnion on dishes field)...\n');

    console.log('Step 1: Fetching all users...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users\n`);

    let totalFavoritesMigrated = 0;
    let totalScannedMigrated = 0;
    let totalDishesPushed = 0;
    const restaurantDishMap = new Map();

    console.log('Step 2: Processing user favorites and history...\n');

    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const favorites = userData.favorites || [];
        const history = userData.history || [];

        const newFavorites = [];
        const newHistory = [];

        for (const fav of favorites) {
            if (fav.restaurantId && fav.datasetId && !fav.place) {
                newFavorites.push(fav);
                const dishKey = `${fav.restaurantId}_${fav.datasetId}`;
                if (!restaurantDishMap.has(dishKey)) {
                    const [place, ...locParts] = fav.restaurantId.split('_');
                    restaurantDishMap.set(dishKey, {
                        restaurantId: fav.restaurantId,
                        datasetId: fav.datasetId,
                        name: fav.name || '',
                        price: fav.price || '',
                        place: place || '',
                        location: locParts.join('_') || ''
                    });
                }
                totalFavoritesMigrated++;
                continue;
            }

            const place = fav.place || '';
            const location = fav.location || '';
            const restaurantId = `${place}_${location}`;
            const datasetId = fav.datasetId || '';

            if (datasetId) {
                const dishKey = `${restaurantId}_${datasetId}`;
                if (!restaurantDishMap.has(dishKey)) {
                    restaurantDishMap.set(dishKey, {
                        restaurantId,
                        datasetId,
                        name: fav.name || '',
                        price: fav.price || '',
                        place,
                        location
                    });
                }
            }

            newFavorites.push({
                datasetId,
                name: fav.name || '',
                price: fav.price || '',
                restaurantId
            });
            totalFavoritesMigrated++;
        }

        for (const item of history) {
            const scannedItems = item.scannedItems || [];
            const newScannedItems = [];

            for (const scanned of scannedItems) {
                if (scanned.restaurantId && scanned.datasetId && !scanned.place) {
                    newScannedItems.push(scanned);
                    const dishKey = `${scanned.restaurantId}_${scanned.datasetId}`;
                    if (!restaurantDishMap.has(dishKey)) {
                        const [place, ...locParts] = scanned.restaurantId.split('_');
                        restaurantDishMap.set(dishKey, {
                            restaurantId: scanned.restaurantId,
                            datasetId: scanned.datasetId,
                            name: scanned.name || '',
                            price: scanned.price || '',
                            place: place || '',
                            location: locParts.join('_') || ''
                        });
                    }
                    totalScannedMigrated++;
                    continue;
                }

                const place = scanned.place || item.place || '';
                const location = scanned.location || item.location || '';
                const restaurantId = `${place}_${location}`;
                const datasetId = scanned.datasetId || '';

                if (datasetId) {
                    const dishKey = `${restaurantId}_${datasetId}`;
                    if (!restaurantDishMap.has(dishKey)) {
                        restaurantDishMap.set(dishKey, {
                            restaurantId,
                            datasetId,
                            name: scanned.name || '',
                            price: scanned.price || '',
                            place,
                            location
                        });
                    }
                }

                newScannedItems.push({
                    datasetId,
                    name: scanned.name || '',
                    price: scanned.price || '',
                    restaurantId
                });
                totalScannedMigrated++;
            }

            newHistory.push({
                ...item,
                scannedItems: newScannedItems
            });
        }

        const updates = {};
        let hasChanges = false;

        if (JSON.stringify(newFavorites) !== JSON.stringify(favorites)) {
            updates.favorites = newFavorites;
            hasChanges = true;
        }
        if (JSON.stringify(newHistory) !== JSON.stringify(history)) {
            updates.history = newHistory;
            hasChanges = true;
        }

        if (hasChanges) {
            await db.collection('users').doc(userDoc.id).update(updates);
            console.log(`  Updated user: ${userDoc.id}`);
        }
    }

    console.log(`\nProcessed ${totalFavoritesMigrated} favorites and ${totalScannedMigrated} scanned items`);

    console.log('\nStep 3: Adding dishes to restaurant documents via arrayUnion...');
    const restaurantBatches = new Map();

    for (const [, dishData] of restaurantDishMap) {
        if (!restaurantBatches.has(dishData.restaurantId)) {
            restaurantBatches.set(dishData.restaurantId, []);
        }
        restaurantBatches.get(dishData.restaurantId).push({
            datasetId: dishData.datasetId,
            name: dishData.name,
            price: dishData.price,
            place: dishData.place,
            location: dishData.location
        });
    }

    for (const [restaurantId, dishes] of restaurantBatches) {
        const ref = db.collection('restaurants').doc(restaurantId);
        const docSnap = await ref.get();

        if (!docSnap.exists) {
            await ref.set({
                name: dishes[0].place,
                location: dishes[0].location,
                dishes,
                firstScanned: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                lastScanned: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                totalScans: 1,
                averageRating: 0,
                totalReviews: 0
            });
            totalDishesPushed += dishes.length;
        } else {
            for (const dish of dishes) {
                await ref.update({
                    dishes: admin.firestore.FieldValue.arrayUnion(dish)
                });
                totalDishesPushed++;
            }
        }
        console.log(`  Restaurant "${restaurantId}": ${dishes.length} dishes added`);
    }

    console.log('\n=== Migration Complete! ===');
    console.log(`Migrated ${totalFavoritesMigrated} favorites`);
    console.log(`Migrated ${totalScannedMigrated} scanned items`);
    console.log(`Pushed ${totalDishesPushed} dishes across ${restaurantBatches.size} restaurants`);

    process.exit(0);
}

migrateDishesToRestaurants().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
