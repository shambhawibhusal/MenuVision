import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { Dish } from '@/types/dashboard';

function dishesToKey(dishes: Dish[]): string {
    return dishes.map(d => d.id).sort().join(',');
}

export function useGloballyLikedDishes() {
    const [globallyLikedDishes, setGloballyLikedDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const prevKeyRef = useRef<string>('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);

            debounceRef.current = setTimeout(() => {
                try {
                    const dishMap = new Map<number, Dish>();
                    const currentUserId = auth.currentUser?.uid;

                    snapshot.docs.forEach(userDoc => {
                        const userData = userDoc.data();
                        const rawFavorites = userData.favorites || [];

                        if (userDoc.id === currentUserId) return;

                        rawFavorites.forEach((fav: any) => {
                            let dish: Dish;
                            if (fav.restaurantId && fav.datasetId && !fav.place) {
                                const [place, ...locParts] = fav.restaurantId.split('_');
                                dish = {
                                    id: Date.now() + Math.random(),
                                    datasetId: fav.datasetId,
                                    name: fav.name,
                                    price: fav.price || 'Price not available',
                                    place: place || '',
                                    location: locParts.join('_') || ''
                                };
                            } else {
                                dish = fav as Dish;
                            }
                            if (dish.id && !dishMap.has(dish.id)) {
                                dishMap.set(dish.id, dish);
                            }
                        });
                    });

                    const result = Array.from(dishMap.values());
                    const newKey = dishesToKey(result);

                    if (newKey !== prevKeyRef.current) {
                        prevKeyRef.current = newKey;
                        setGloballyLikedDishes(result);
                    }
                    setError(null);
                } catch (err: any) {
                    console.error('Error fetching globally liked dishes:', err);
                    setError(err.message || 'Failed to fetch globally liked dishes');
                } finally {
                    setLoading(false);
                }
            }, 300);
        }, (err) => {
            console.error('Error in globally liked dishes listener:', err);
            setError(err.message || 'Failed to listen to globally liked dishes');
            setLoading(false);
        });

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            unsubscribe();
        };
    }, []);

    return { globallyLikedDishes, loading, error };
}
