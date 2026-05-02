import { db } from '../firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { NewRestaurantReview, Restaurant } from '@/types/dashboard';

export const incrementRestaurantScanCount = async (restaurantId: string): Promise<boolean> => {
    try {
        const restaurantDocRef = doc(db, 'restaurants', restaurantId);
        
        const restaurantDoc = await getDoc(restaurantDocRef);
        
        if (!restaurantDoc.exists()) {
            const [place, location] = restaurantId.split('_');
            await updateDoc(restaurantDocRef, {
                name: place || restaurantId,
                location: location || '',
                totalScans: 1,
                firstScanned: serverTimestamp(),
                lastScanned: serverTimestamp(),
                averageRating: 0,
                totalReviews: 0
            });
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