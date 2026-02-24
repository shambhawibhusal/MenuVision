import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { Dish } from '@/types/dashboard';

export function useDishes() {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDishes = async () => {
            try {
                setLoading(true);
                const dishesCollection = collection(db, 'dishes');
                const snapshot = await getDocs(dishesCollection);
                
                const fetchedDishes: Dish[] = snapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    return {
                        id: data.id || parseInt(doc.id) || index + 1,
                        name: data.name || 'Unknown Dish',
                        place: data.place || data.restaurant || 'Unknown Restaurant',
                        price: data.price || 'Price not available',
                        category: data.category || 'mains',
                        cuisine: data.cuisine || 'International',
                        tags: data.tags || [],
                        priceRange: data.priceRange || 'moderate',
                        calories: data.calories,
                        description: data.description,
                        ingredients: data.ingredients,
                        imageUrl: data.imageUrl,
                        allergens: data.allergens,
                        isVegan: data.isVegan,
                        isVegetarian: data.isVegetarian,
                        isGlutenFree: data.isGlutenFree,
                        origin: data.origin,
                        location: data.location
                    };
                });
                
                setDishes(fetchedDishes);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching dishes:', err);
                setError(err.message || 'Failed to fetch dishes');
                setDishes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDishes();
    }, []);

    return { dishes, loading, error, refetch: () => setLoading(true) };
}
