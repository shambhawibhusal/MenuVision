import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface DishAverageRating {
    dishId: string;
    averageRating: number;
    totalReviews: number;
}

export function useDishAverageRatings(dishIds: string[]): Record<string, DishAverageRating> {
    const [ratings, setRatings] = useState<Record<string, DishAverageRating>>({});

    useEffect(() => {
        const fetchRatings = async () => {
            if (dishIds.length === 0) return;
            
            const newRatings: Record<string, DishAverageRating> = {};

            try {
                for (const dishId of dishIds) {
                    try {
                        const reviewsRef = collection(db, 'dishes', dishId, 'reviews');
                        const snapshot = await getDocs(reviewsRef);
                        
                        if (snapshot.size > 0) {
                            const reviews = snapshot.docs.map(doc => doc.data());
                            const totalRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
                            const avg = Math.round((totalRating / reviews.length) * 10) / 10;
                            newRatings[dishId] = {
                                dishId,
                                averageRating: avg,
                                totalReviews: reviews.length
                            };
                        }
                    } catch (err) {
                        console.warn(`Error fetching reviews for dish ${dishId}:`, err);
                    }
                }
                setRatings(newRatings);
            } catch (err) {
                console.error('Error fetching dish ratings:', err);
            }
        };

        fetchRatings();
    }, [dishIds.join(',')]);

    return ratings;
}