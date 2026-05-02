import { db } from '../firebase';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { NewReview } from '@/types/dashboard';

export const addReview = async (review: NewReview): Promise<boolean> => {
    try {
        await addDoc(collection(db, 'reviews'), {
            dishId: review.dishId,
            userId: review.userId,
            userName: review.userName || 'Anonymous',
            rating: review.rating,
            comment: review.comment || '',
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error adding review:', error);
        return false;
    }
};

export const getUserReviewForDish = async (
    userId: string,
    dishId: string
): Promise<string | null> => {
    try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where('userId', '==', userId), where('dishId', '==', dishId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;
        return snapshot.docs[0].id;
    } catch (error) {
        console.error('Error getting user review:', error);
        return null;
    }
};