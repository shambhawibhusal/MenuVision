import { useState, useEffect, useRef, useMemo } from 'react';
import { db, auth } from '@/firebase';
import { getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface DishViewContext {
    datasetId: string;
    place: string;
    location: string;
}

export function makeViewKey(restaurantId: string, datasetId: string): string {
    return `${restaurantId}|${datasetId}`;
}

interface UseDishPopularityReturn {
    viewCountMap: Record<string, number>;
    trackView: (datasetId: string, place: string, location: string) => Promise<void>;
}

export function useDishPopularity(dishContexts: DishViewContext[]): UseDishPopularityReturn {
    const [viewCountMap, setViewCountMap] = useState<Record<string, number>>({});
    const dishToRestaurantRef = useRef<Record<string, string>>({});

    const contextKey = useMemo(() =>
        dishContexts.map(c => `${c.datasetId}|${c.place}|${c.location}`).sort().join('__'),
        [dishContexts]
    );

    useEffect(() => {
        const fetchViewCounts = async () => {
            if (dishContexts.length === 0) return;

            const restaurantIds = new Set<string>();
            for (const ctx of dishContexts) {
                if (ctx.place) {
                    restaurantIds.add(`${ctx.place}_${ctx.location || ''}`);
                }
            }

            const newViewCounts: Record<string, number> = {};
            const newDishToRestaurant: Record<string, string> = {};

            for (const restaurantId of restaurantIds) {
                try {
                    const snap = await getDoc(doc(db, 'restaurants', restaurantId));
                    if (snap.exists()) {
                        const data = snap.data();
                        const dishViews = data.dishViews || {};
                        for (const [dishId, userIds] of Object.entries(dishViews)) {
                            newViewCounts[makeViewKey(restaurantId, dishId)] = (userIds as string[]).length;
                        }
                        const dishes = data.dishes || [];
                        for (const dish of dishes) {
                            if (dish.datasetId) {
                                newDishToRestaurant[dish.datasetId] = restaurantId;
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Error fetching views for restaurant', restaurantId, err);
                }
            }

            dishToRestaurantRef.current = newDishToRestaurant;

            setViewCountMap(prev => {
                const merged = { ...prev };
                for (const [key, val] of Object.entries(newViewCounts)) {
                    if (merged[key] === undefined) {
                        merged[key] = val;
                    }
                }
                for (const ctx of dishContexts) {
                    const rId = `${ctx.place}_${ctx.location || ''}`;
                    const vk = makeViewKey(rId, ctx.datasetId);
                    if (merged[vk] === undefined) {
                        merged[vk] = 0;
                    }
                }
                return merged;
            });
        };

        fetchViewCounts();
    }, [contextKey]);

    const trackView = async (datasetId: string, place: string, location: string): Promise<void> => {
        if (!auth.currentUser?.uid) return;

        const userId = auth.currentUser.uid;
        let restaurantId = `${place}_${location || ''}`;

        try {
            const restaurantRef = doc(db, 'restaurants', restaurantId);
            const snap = await getDoc(restaurantRef);

            if (snap.exists()) {
                const existingViews = snap.data()?.dishViews?.[datasetId] || [];
                if ((existingViews as string[]).includes(userId)) return;
            } else {
                const cachedId = dishToRestaurantRef.current[datasetId];
                if (cachedId) {
                    restaurantId = cachedId;
                    const cachedSnap = await getDoc(doc(db, 'restaurants', cachedId));
                    if (cachedSnap.exists()) {
                        const existingViews = cachedSnap.data()?.dishViews?.[datasetId] || [];
                        if ((existingViews as string[]).includes(userId)) return;
                    }
                }
            }

            const vk = makeViewKey(restaurantId, datasetId);
            setViewCountMap(prev => ({
                ...prev,
                [vk]: (prev[vk] || 0) + 1
            }));

            await updateDoc(doc(db, 'restaurants', restaurantId), {
                [`dishViews.${datasetId}`]: arrayUnion(userId)
            });
        } catch (err: any) {
            if (err?.code === 'not-found' || (typeof err?.code === 'number' && err.code === 5)) {
                const cachedId = dishToRestaurantRef.current[datasetId];
                if (cachedId && cachedId !== restaurantId) {
                    try {
                        const vk = makeViewKey(cachedId, datasetId);
                        setViewCountMap(prev => ({
                            ...prev,
                            [vk]: (prev[vk] || 0) + 1
                        }));
                        await updateDoc(doc(db, 'restaurants', cachedId), {
                            [`dishViews.${datasetId}`]: arrayUnion(userId)
                        });
                    } catch (e) {
                        console.error('Error tracking view via fallback:', e);
                        const vk = makeViewKey(cachedId, datasetId);
                        setViewCountMap(prev => ({
                            ...prev,
                            [vk]: Math.max(0, (prev[vk] || 0) - 1)
                        }));
                    }
                }
            } else {
                console.error('Error tracking view:', err);
            }
        }
    };

    return { viewCountMap, trackView };
}

export function getPopularityLabel(scanCount: number): string {
    if (scanCount >= 100) return 'Very Popular';
    if (scanCount >= 50) return 'Popular';
    if (scanCount >= 20) return 'Trending';
    if (scanCount >= 5) return 'Rising';
    return 'New';
}

export function getPopularityColor(scanCount: number): string {
    if (scanCount >= 100) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (scanCount >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (scanCount >= 20) return 'text-green-600 bg-green-50 border-green-200';
    if (scanCount >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
}
