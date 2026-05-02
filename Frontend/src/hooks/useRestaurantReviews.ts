import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { RestaurantReview, Restaurant } from '@/types/dashboard';

interface UseRestaurantReviewsResult {
    reviews: RestaurantReview[];
    averageRating: number;
    totalReviews: number;
    restaurant: Restaurant | null;
    loading: boolean;
}

export function useRestaurantReviews(restaurantId: string | null): UseRestaurantReviewsResult {
    const [reviews, setReviews] = useState<RestaurantReview[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!restaurantId || typeof restaurantId !== 'string' || restaurantId.trim() === '') {
            setReviews([]);
            setAverageRating(0);
            setTotalReviews(0);
            setRestaurant(null);
            return;
        }

        setLoading(true);

        const fetchRestaurantData = async () => {
            try {
                const restaurantDocRef = doc(db, 'restaurants', restaurantId);
                const restaurantDoc = await getDoc(restaurantDocRef);

                if (restaurantDoc.exists()) {
                    const data = restaurantDoc.data();
                    setRestaurant({
                        id: restaurantDoc.id,
                        ...data
                    } as Restaurant);
                    setAverageRating(data.averageRating || 0);
                    setTotalReviews(data.totalReviews || 0);
                }
            } catch (error) {
                console.error('Error fetching restaurant:', error);
            }
        };

        fetchRestaurantData();

        const reviewsRef = collection(db, 'restaurants', restaurantId, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedReviews: RestaurantReview[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        userId: data.userId,
                        userName: data.userName || 'Anonymous',
                        rating: data.rating,
                        comment: data.comment || '',
                        createdAt: data.createdAt,
                    };
                });

                setReviews(fetchedReviews);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching restaurant reviews:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [restaurantId]);

    return { reviews, averageRating, totalReviews, restaurant, loading };
}