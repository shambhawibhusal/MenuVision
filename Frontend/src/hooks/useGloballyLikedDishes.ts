import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { Dish } from '@/types/dashboard';

export function useGloballyLikedDishes() {
    const [globallyLikedDishes, setGloballyLikedDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGloballyLikedDishes = async () => {
            try {
                setLoading(true);
                const usersCollection = collection(db, 'users');
                const snapshot = await getDocs(usersCollection);
                
                const dishMap = new Map<number, Dish>();
                
                snapshot.docs.forEach(userDoc => {
                    const userData = userDoc.data();
                    const favorites: Dish[] = userData.favorites || [];
                    
                    favorites.forEach((dish: Dish) => {
                        if (dish.id && !dishMap.has(dish.id)) {
                            dishMap.set(dish.id, dish);
                        }
                    });
                });
                
                setGloballyLikedDishes(Array.from(dishMap.values()));
                setError(null);
            } catch (err: any) {
                console.error('Error fetching globally liked dishes:', err);
                setError(err.message || 'Failed to fetch globally liked dishes');
                setGloballyLikedDishes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGloballyLikedDishes();
    }, []);

    return { globallyLikedDishes, loading, error };
}
