// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');
const axios = require('axios');

admin.initializeApp();

const client = new vision.ImageAnnotatorClient();

// Cloud Function triggered when image is uploaded
exports.processMenuImage = functions.storage.object().onFinalize(async (object) => {
    const filePath = object.name;

    // Only process images in 'menu-scans/' folder
    if (!filePath.startsWith('menu-scans/')) {
        return null;
    }

    const bucket = admin.storage().bucket(object.bucket);
    const file = bucket.file(filePath);

    try {
        // Perform OCR using Google Cloud Vision
        const [result] = await client.textDetection(`gs://${object.bucket}/${filePath}`);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            console.log('No text found in image');
            return null;
        }

        const fullText = detections[0].description;

        // Parse menu items from text
        const menuItems = parseMenuText(fullText);

        // Enrich with images and additional data
        const enrichedItems = await enrichMenuItems(menuItems);

        // Extract userId from file path (e.g., menu-scans/userId/image.jpg)
        const userId = filePath.split('/')[1];

        // Store in Firestore
        const scanRef = admin.firestore().collection('menuScans').doc();
        await scanRef.set({
            userId: userId,
            imageUrl: `gs://${object.bucket}/${filePath}`,
            rawText: fullText,
            menuItems: enrichedItems,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });

        console.log('Menu processed successfully:', scanRef.id);
        return scanRef.id;

    } catch (error) {
        console.error('Error processing menu:', error);
        throw error;
    }
});

// HTTP Function for manual processing
exports.analyzeMenu = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { imageUrl } = data;
    const userId = context.auth.uid;

    try {
        // Perform OCR
        const [result] = await client.textDetection(imageUrl);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            return { success: false, message: 'No text found in image' };
        }

        const fullText = detections[0].description;
        const menuItems = parseMenuText(fullText);
        const enrichedItems = await enrichMenuItems(menuItems);

        // Store results
        const scanRef = admin.firestore().collection('menuScans').doc();
        await scanRef.set({
            userId: userId,
            imageUrl: imageUrl,
            rawText: fullText,
            menuItems: enrichedItems,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });

        return {
            success: true,
            scanId: scanRef.id,
            menuItems: enrichedItems
        };

    } catch (error) {
        console.error('Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// Parse menu text into structured items
function parseMenuText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const menuItems = [];
    let currentItem = null;

    // Common price patterns
    const pricePattern = /(?:Rs\.?\s*|₹\s*)(\d+(?:,\d+)?(?:\.\d{2})?)/i;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and common headers
        if (!line || /^(menu|price|dish|item|starters|main|dessert|drinks)$/i.test(line)) {
            continue;
        }

        const priceMatch = line.match(pricePattern);

        if (priceMatch) {
            // Line contains price
            const price = parseInt(priceMatch[1].replace(',', ''));
            const nameWithoutPrice = line.replace(pricePattern, '').trim();

            if (nameWithoutPrice) {
                menuItems.push({
                    name: nameWithoutPrice,
                    price: price,
                    description: ''
                });
            } else if (currentItem) {
                // Price on separate line
                currentItem.price = price;
                currentItem = null;
            }
        } else if (line.length > 3 && line.length < 100) {
            // Potential dish name
            currentItem = {
                name: line,
                price: 0,
                description: ''
            };

            // Check next line for description or price
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                const nextPriceMatch = nextLine.match(pricePattern);

                if (nextPriceMatch) {
                    currentItem.price = parseInt(nextPriceMatch[1].replace(',', ''));
                    i++; // Skip next line
                } else if (nextLine.length > 10 && nextLine.length < 200) {
                    currentItem.description = nextLine;
                    i++; // Skip next line
                }
            }

            menuItems.push(currentItem);
        }
    }

    return menuItems;
}

// Enrich menu items with images and categorization
async function enrichMenuItems(items) {
    const enrichedItems = [];

    for (const item of items) {
        try {
            // Get dish image from Unsplash API (free)
            const imageUrl = await fetchDishImage(item.name);

            // Categorize dish
            const category = categorizeDish(item.name, item.description);

            // Detect if vegetarian
            const isVeg = detectVegetarian(item.name, item.description);

            enrichedItems.push({
                id: generateId(),
                name: item.name,
                description: item.description || 'Delicious dish from our menu',
                price: item.price || 0,
                imageUrl: imageUrl,
                category: category,
                type: isVeg ? 'veg' : 'non-veg',
                rating: (Math.random() * 1.5 + 3.5).toFixed(1), // Random rating 3.5-5.0
                createdAt: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error enriching item:', item.name, error);
            // Add item anyway with defaults
            enrichedItems.push({
                id: generateId(),
                name: item.name,
                description: item.description || '',
                price: item.price || 0,
                imageUrl: getDefaultImage(item.name),
                category: 'other',
                type: 'non-veg',
                rating: '4.0',
                createdAt: new Date().toISOString()
            });
        }
    }

    return enrichedItems;
}

// Fetch dish image from Unsplash
async function fetchDishImage(dishName) {
    try {
        // Use Unsplash API (requires API key - get free at unsplash.com/developers)
        const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY';
        const query = encodeURIComponent(dishName + ' food');

        const response = await axios.get(
            `https://api.unsplash.com/search/photos?query=${query}&per_page=1`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );

        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0].urls.regular;
        }

        return getDefaultImage(dishName);

    } catch (error) {
        console.error('Error fetching image:', error);
        return getDefaultImage(dishName);
    }
}

// Get default emoji/image based on dish name
function getDefaultImage(dishName) {
    const name = dishName.toLowerCase();

    if (name.includes('pizza')) return '🍕';
    if (name.includes('burger')) return '🍔';
    if (name.includes('momo')) return '🥟';
    if (name.includes('chicken') || name.includes('butter')) return '🍗';
    if (name.includes('ramen') || name.includes('noodle')) return '🍜';
    if (name.includes('rice') || name.includes('biryani')) return '🍛';
    if (name.includes('sandwich')) return '🥪';
    if (name.includes('taco')) return '🌮';
    if (name.includes('pasta') || name.includes('spaghetti')) return '🍝';
    if (name.includes('salad')) return '🥗';
    if (name.includes('soup')) return '🍲';
    if (name.includes('dessert') || name.includes('cake')) return '🍰';
    if (name.includes('ice cream')) return '🍦';

    return '🍽️';
}

// Categorize dish
function categorizeDish(name, description) {
    const text = (name + ' ' + description).toLowerCase();

    if (/(starter|appetizer|soup|salad)/i.test(text)) return 'starters';
    if (/(main|rice|biryani|curry)/i.test(text)) return 'mains';
    if (/(dessert|cake|ice cream|sweet)/i.test(text)) return 'desserts';
    if (/(drink|juice|coffee|tea|soda)/i.test(text)) return 'drinks';
    if (/(pizza|burger|sandwich)/i.test(text)) return 'fast-food';

    return 'other';
}

// Detect if vegetarian
function detectVegetarian(name, description) {
    const text = (name + ' ' + description).toLowerCase();

    // Non-veg keywords
    if (/(chicken|mutton|lamb|beef|pork|fish|egg|meat|prawn|shrimp)/i.test(text)) {
        return false;
    }

    // Veg keywords
    if (/(veg|vegetarian|paneer|tofu|mushroom)/i.test(text)) {
        return true;
    }

    return false; // Default to non-veg for safety
}

// Generate unique ID
function generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}