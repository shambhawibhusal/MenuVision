import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { Dish } from '@/types/dashboard';
import { getPriceRange } from '@/utils/recommendations';

export function useDishes() {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDishes = async () => {
            try {
                setLoading(true);
                const dishesCollection = collection(db, 'menuDataset');
                const snapshot = await getDocs(dishesCollection);
                
                const fetchedDishes: Dish[] = snapshot.docs.map((doc, index) => {
                    const data = doc.data();
                    const priceValue = data.price || 'Price not available';
                    return {
                        id: parseInt(doc.id.replace(/\D/g, '')) || index + 1,
                        datasetId: doc.id,
                        name: data.name || 'Unknown Dish',
                        place: data.place || data.restaurant || 'MenuVision Dataset',
                        price: priceValue,
                        priceRange: data.priceRange || (priceValue.startsWith('Rs.') ? getPriceRange(priceValue) : 'moderate'),
                        category: data.category || 'mains',
                        cuisine: data.cuisine || 'International',
                        tags: data.tags || [],
                        calories: data.calories,
                        prepTime: data.prepTime,
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
