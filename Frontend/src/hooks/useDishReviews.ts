import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { DishReview } from '@/types/dashboard';

interface UseDishReviewsResult {
    reviews: DishReview[];
    averageRating: number;
    totalReviews: number;
    loading: boolean;
}

export function useDishReviews(dishId: string | null): UseDishReviewsResult {
    const [reviews, setReviews] = useState<DishReview[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!dishId) {
            setReviews([]);
            setAverageRating(0);
            setTotalReviews(0);
            return;
        }

        setLoading(true);
        const reviewsRef = collection(db, 'reviews');
        const q = query(
            reviewsRef,
            where('dishId', '==', dishId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedReviews: DishReview[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        dishId: data.dishId,
                        userId: data.userId,
                        userName: data.userName || 'Anonymous',
                        rating: data.rating,
                        comment: data.comment || '',
                        createdAt: data.createdAt,
                    };
                });

                setReviews(fetchedReviews);
                setTotalReviews(fetchedReviews.length);

                if (fetchedReviews.length > 0) {
                    const avg =
                        fetchedReviews.reduce((sum, r) => sum + r.rating, 0) /
                        fetchedReviews.length;
                    setAverageRating(Math.round(avg * 10) / 10);
                } else {
                    setAverageRating(0);
                }

                setLoading(false);
            },
            (error) => {
                console.error('Error fetching reviews:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [dishId]);

    return { reviews, averageRating, totalReviews, loading };
}
