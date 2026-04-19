import { db } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    increment
} from 'firebase/firestore';
import { MenuDatasetItem, ScannedItem } from '@/types/dashboard';

const DATASET_COLLECTION = 'menuDataset';

/**
 * Generate a consistent document ID for a dish based on its normalized name
 */
const generateDishId = (dishName: string): string => {
    return dishName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

/**
 * Check if a dish exists in the dataset by name (case-insensitive)
 */
export const checkDishInDataset = async (dishName: string): Promise<MenuDatasetItem | null> => {
    try {
        const normalizedName = dishName.toLowerCase().trim();
        const dishId = generateDishId(dishName);
        console.log(`[Dataset Service] Checking for dish "${dishName}" (ID: ${dishId})`);

        // First try exact document ID match (fastest)
        const docRef = doc(db, DATASET_COLLECTION, dishId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log(`[Dataset Service] Found dish "${dishName}" in dataset (scanCount: ${data.scanCount})`);
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as MenuDatasetItem;
        }

        console.log(`[Dataset Service] Dish "${dishName}" not found by ID, trying nameLower query...`);
        
        // Fallback: query by normalized name field
        const q = query(
            collection(db, DATASET_COLLECTION),
            where('nameLower', '==', normalizedName)
        );
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
            const doc = querySnap.docs[0];
            const data = doc.data();
            console.log(`[Dataset Service] Found dish "${dishName}" by nameLower query (scanCount: ${data.scanCount})`);
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as MenuDatasetItem;
        }

        console.log(`[Dataset Service] Dish "${dishName}" not found in dataset`);
        return null;
    } catch (error) {
        console.error('Error checking dish in dataset:', error);
        return null;
    }
};

/**
 * Search dishes by name (partial match, case-insensitive)
 */
export const searchDishesByName = async (searchTerm: string): Promise<MenuDatasetItem[]> => {
    try {
        const normalizedSearch = searchTerm.toLowerCase().trim();

        // Firestore doesn't support native partial text search
        // For now, we'll fetch and filter client-side (consider Algolia for production)
        const q = query(
            collection(db, DATASET_COLLECTION),
            where('nameLower', '>=', normalizedSearch),
            where('nameLower', '<=', normalizedSearch + '\uf8ff')
        );

        const querySnap = await getDocs(q);
        return querySnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as MenuDatasetItem;
        });
    } catch (error) {
        console.error('Error searching dishes:', error);
        return [];
    }
};

/**
 * Add a new dish to the dataset
 */
export const addDishToDataset = async (dish: Omit<MenuDatasetItem, 'id' | 'createdAt' | 'updatedAt' | 'scanCount'>): Promise<string | null> => {
    try {
        const dishId = generateDishId(dish.name);
        const docRef = doc(db, DATASET_COLLECTION, dishId);

        // Check if already exists
        const existingSnap = await getDoc(docRef);
        if (existingSnap.exists()) {
            const currentData = existingSnap.data();
            console.log(`[Dataset Service] Dish already exists: "${dish.name}" (current scanCount: ${currentData.scanCount})`);
            // Increment scan count and update timestamp
            await updateDoc(docRef, {
                scanCount: increment(1),
                updatedAt: serverTimestamp()
            });
            console.log(`[Dataset Service] Incremented scanCount for "${dish.name}"`);
            return dishId;
        }

        // Create new entry
        console.log(`[Dataset Service] Creating new dish: "${dish.name}"`);
        
        let imageUrlToStore: string | null = null;
        if (dish.imageUrl && !dish.imageUrl.startsWith('data:image')) {
            imageUrlToStore = dish.imageUrl;
        } else if (dish.imageUrl && dish.imageUrl.startsWith('data:image')) {
            if (dish.imageUrl.length < 200000) {  // ~200KB limit for 256x256 JPEG
                imageUrlToStore = dish.imageUrl;
            } else {
                console.log(`[Dataset Service] Skipping large image (${dish.imageUrl.length} bytes) for "${dish.name}"`);
            }
        }
        
        const newDish: Omit<MenuDatasetItem, 'id'> = {
            ...dish,
            imageUrl: imageUrlToStore,
            nameLower: dish.name.toLowerCase().trim(),
            scanCount: 1,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any
        };

        await setDoc(docRef, newDish);
        console.log(`[Dataset Service] Successfully created dish "${dish.name}" with ID: ${dishId}`);
        return dishId;
    } catch (error) {
        console.error('Error adding dish to dataset:', error);
        return null;
    }
};

/**
 * Update an existing dish in the dataset
 */
export const updateDishInDataset = async (
    dishId: string,
    data: Partial<Omit<MenuDatasetItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<boolean> => {
    try {
        const docRef = doc(db, DATASET_COLLECTION, dishId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating dish in dataset:', error);
        return false;
    }
};

/**
 * Increment scan count for an existing dish
 */
export const incrementScanCount = async (dishId: string): Promise<boolean> => {
    try {
        const docRef = doc(db, DATASET_COLLECTION, dishId);
        await updateDoc(docRef, {
            scanCount: increment(1),
            updatedAt: serverTimestamp()
        });
        console.log(`[Dataset Service] Incremented scanCount for dish ID: ${dishId}`);
        return true;
    } catch (error) {
        console.error('Error incrementing scan count:', error);
        return false;
    }
};

/**
 * Get dish by ID
 */
export const getDishById = async (dishId: string): Promise<MenuDatasetItem | null> => {
    try {
        const docRef = doc(db, DATASET_COLLECTION, dishId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as MenuDatasetItem;
        }

        return null;
    } catch (error) {
        console.error('Error getting dish by ID:', error);
        return null;
    }
};

/**
 * Resolve scanned item with full data from dataset
 * Returns the scanned item merged with dataset data (or original if no datasetId)
 */
export const resolveScannedItem = async (scannedItem: ScannedItem): Promise<ScannedItem> => {
    if (!scannedItem.datasetId) {
        return scannedItem;
    }

    try {
        const datasetItem = await getDishById(scannedItem.datasetId);
        if (!datasetItem) {
            return scannedItem;
        }

        return {
            ...scannedItem,
            description: datasetItem.description,
            ingredients: datasetItem.ingredients,
            calories: datasetItem.calories,
            prepTime: datasetItem.prepTime,
            imageUrl: datasetItem.imageUrl,
            allergens: datasetItem.allergens,
            isVegan: datasetItem.isVegan,
            isVegetarian: datasetItem.isVegetarian,
            isGlutenFree: datasetItem.isGlutenFree,
            origin: datasetItem.origin,
            category: datasetItem.category,
            latitude: datasetItem.latitude ?? scannedItem.latitude,
            longitude: datasetItem.longitude ?? scannedItem.longitude
        };
    } catch (error) {
        console.error('Error resolving scanned item:', error);
        return scannedItem;
    }
};

/**
 * Resolve multiple scanned items with dataset data
 */
export const resolveScannedItems = async (scannedItems: ScannedItem[]): Promise<ScannedItem[]> => {
    return Promise.all(scannedItems.map(item => resolveScannedItem(item)));
};

/**
 * Merge AI-extracted data with dataset data, preferring dataset for most fields
 * but keeping extracted data as fallback
 */
export const mergeWithDataset = (
    extractedData: {
        name: string;
        price: string;
        description?: string;
        ingredients?: string | string[];
        calories?: string;
        prepTime?: string;
        imageUrl?: string | null;
        allergens?: string[];
        isVegan?: boolean;
        isVegetarian?: boolean;
        isGlutenFree?: boolean;
        origin?: string;
        category?: string;
    },
    datasetItem: MenuDatasetItem | null
) => {
    if (!datasetItem) {
        // No dataset match - return extracted data
        return {
            name: extractedData.name,
            price: extractedData.price,
            description: extractedData.description,
            ingredients: extractedData.ingredients,
            calories: extractedData.calories,
            prepTime: extractedData.prepTime,
            imageUrl: extractedData.imageUrl,
            allergens: extractedData.allergens,
            isVegan: extractedData.isVegan,
            isVegetarian: extractedData.isVegetarian,
            isGlutenFree: extractedData.isGlutenFree,
            origin: extractedData.origin,
            category: extractedData.category
        };
    }

    // Use dataset data, but always use scanned price
    return {
        name: datasetItem.name,
        price: extractedData.price, // Always use scanned price
        description: datasetItem.description || extractedData.description,
        ingredients: datasetItem.ingredients || extractedData.ingredients,
        calories: datasetItem.calories || extractedData.calories,
        prepTime: datasetItem.prepTime || extractedData.prepTime,
        imageUrl: datasetItem.imageUrl || extractedData.imageUrl,
        allergens: datasetItem.allergens || extractedData.allergens,
        isVegan: datasetItem.isVegan ?? extractedData.isVegan,
        isVegetarian: datasetItem.isVegetarian ?? extractedData.isVegetarian,
        isGlutenFree: datasetItem.isGlutenFree ?? extractedData.isGlutenFree,
        origin: datasetItem.origin || extractedData.origin,
        category: datasetItem.category || extractedData.category
    };
};

export { generateDishId };
