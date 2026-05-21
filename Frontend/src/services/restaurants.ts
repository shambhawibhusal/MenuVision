import { db } from '../firebase';
import { doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';
import { NewRestaurantReview, Restaurant, RestaurantDish } from '@/types/dashboard';

export const incrementRestaurantScanCount = async (restaurantId: string): Promise<boolean> => {
    try {
        const restaurantDocRef = doc(db, 'restaurants', restaurantId);
        
        const restaurantDoc = await getDoc(restaurantDocRef);
        
        if (!restaurantDoc.exists()) {
            const [place, location] = restaurantId.split('_');
            await setDoc(restaurantDocRef, {
                name: place || restaurantId,
                location: location || '',
                totalScans: 1,
                firstScanned: serverTimestamp(),
                lastScanned: serverTimestamp(),
                averageRating: 0,
                totalReviews: 0
            }, { merge: true });
        } else {
            await updateDoc(restaurantDocRef, {
                totalScans: increment(1),
                lastScanned: serverTimestamp()
            });
        }
        
        console.log(`[Restaurant Service] Incremented totalScans for: ${restaurantId}`);
        return true;
    } catch (error) {
        console.error('Error incrementing restaurant scan count:', error);
        return false;
    }
};

export const addRestaurantReview = async (review: NewRestaurantReview): Promise<boolean> => {
    try {
        const restaurantDocRef = doc(db, 'restaurants', review.restaurantId);
        const restaurantDoc = await getDoc(restaurantDocRef);

        if (!restaurantDoc.exists()) {
            console.log('Restaurant does not exist, creating...');
            const [place, location] = review.restaurantId.split('_');
            await updateDoc(restaurantDocRef, {
                name: place || review.restaurantId,
                location: location || '',
                totalScans: 0,
                averageRating: 0,
                totalReviews: 0
            });
        }

        const reviewsRef = collection(db, 'restaurants', review.restaurantId, 'reviews');
        await addDoc(reviewsRef, {
            userId: review.userId,
            userName: review.userName || 'Anonymous',
            rating: review.rating,
            comment: review.comment || '',
            createdAt: serverTimestamp()
        });

        const reviewsSnapshot = await getDoc(restaurantDocRef);
        const currentData = reviewsSnapshot.data();
        const currentReviews = currentData?.totalReviews || 0;
        const currentAvg = currentData?.averageRating || 0;

        const newTotal = currentReviews + 1;
        const newAvg = ((currentAvg * currentReviews) + review.rating) / newTotal;

        await updateDoc(restaurantDocRef, {
            averageRating: Math.round(newAvg * 10) / 10,
            totalReviews: newTotal
        });

        return true;
    } catch (error) {
        console.error('Error adding restaurant review:', error);
        return false;
    }
};

export const getRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
    try {
        const restaurantDocRef = doc(db, 'restaurants', restaurantId);
        const restaurantDoc = await getDoc(restaurantDocRef);

        if (!restaurantDoc.exists()) {
            return null;
        }

        return {
            id: restaurantDoc.id,
            ...restaurantDoc.data()
        } as Restaurant;
    } catch (error) {
        console.error('Error getting restaurant:', error);
        return null;
    }
};

export const getRestaurantByNameAndLocation = async (name: string, location: string): Promise<Restaurant | null> => {
    const restaurantId = `${name}_${location}`;
    return getRestaurantById(restaurantId);
};

export const addDishToRestaurant = async (restaurantId: string, dish: RestaurantDish): Promise<boolean> => {
    try {
        if (!dish.datasetId) return false;
        const dishData = {
            datasetId: dish.datasetId,
            name: dish.name,
            price: dish.price,
            place: dish.place,
            location: dish.location
        };
        await updateDoc(doc(db, 'restaurants', restaurantId), {
            dishes: arrayUnion(dishData)
        }).catch(async (err: any) => {
            if (err.code === 'not-found') {
                await setDoc(doc(db, 'restaurants', restaurantId), {
                    name: dish.place,
                    location: dish.location,
                    dishes: [dishData],
                    firstScanned: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    lastScanned: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    totalScans: 1,
                    averageRating: 0,
                    totalReviews: 0
                }, { merge: true });
            } else {
                throw err;
            }
        });
        return true;
    } catch (error) {
        console.error('Error adding dish to restaurant:', error);
        return false;
    }
};

export const getRestaurantDishes = async (restaurantId: string): Promise<RestaurantDish[]> => {
    try {
        const snap = await getDoc(doc(db, 'restaurants', restaurantId));
        if (snap.exists()) {
            const data = snap.data();
            return (data.dishes || []) as RestaurantDish[];
        }
        return [];
    } catch (error) {
        console.error('Error getting restaurant dishes:', error);
        return [];
    }
};

export const getDishFromRestaurant = async (restaurantId: string, datasetId: string): Promise<RestaurantDish | null> => {
    try {
        const dishes = await getRestaurantDishes(restaurantId);
        return dishes.find(d => d.datasetId === datasetId) || null;
    } catch (error) {
        console.error('Error getting dish from restaurant:', error);
        return null;
    }
};