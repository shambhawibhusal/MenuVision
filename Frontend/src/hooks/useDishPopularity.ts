import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { getDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

interface DishPopularity {
    dishId: string;
    scanCount: number;
    viewCount: number;
    orderCount: number;
}

interface UseDishPopularityReturn {
    popularityMap: Record<string, DishPopularity>;
    trackView: (dishId: string) => Promise<void>;
    getPopularity: (dishId: string) => DishPopularity | undefined;
}

export function useDishPopularity(dishIds: string[]): UseDishPopularityReturn {
    const [popularityMap, setPopularityMap] = useState<Record<string, DishPopularity>>({});

    useEffect(() => {
        const fetchPopularity = async () => {
            if (dishIds.length === 0) return;
            
            const newPopularity: Record<string, DishPopularity> = {};

            try {
                for (const dishId of dishIds) {
                    try {
                        const dishRef = doc(db, 'menuDataset', dishId);
                        const dishSnap = await getDoc(dishRef);

                        if (dishSnap.exists()) {
                            const data = dishSnap.data();
                            newPopularity[dishId] = {
                                dishId,
                                scanCount: data.scanCount || 0,
                                viewCount: data.viewCount || 0,
                                orderCount: data.orderCount || 0
                            };
                        } else {
                            newPopularity[dishId] = {
                                dishId,
                                scanCount: 0,
                                viewCount: 0,
                                orderCount: 0
                            };
                        }
                    } catch (err) {
                        console.warn(`Error fetching popularity for dish ${dishId}:`, err);
                        newPopularity[dishId] = {
                            dishId,
                            scanCount: 0,
                            viewCount: 0,
                            orderCount: 0
                        };
                    }
                }
                setPopularityMap(newPopularity);
            } catch (err) {
                console.error('Error fetching dish popularity:', err);
            }
        };

        fetchPopularity();
    }, [dishIds.join(',')]);

    const trackView = async (dishId: string): Promise<void> => {
        try {
            const dishRef = doc(db, 'menuDataset', dishId);
            await updateDoc(dishRef, {
                viewCount: increment(1),
                lastViewed: serverTimestamp()
            });

            setPopularityMap(prev => ({
                ...prev,
                [dishId]: {
                    ...prev[dishId],
                    viewCount: (prev[dishId]?.viewCount || 0) + 1
                }
            }));
        } catch (err) {
            console.error('Error tracking view:', err);
        }
    };

    const getPopularity = (dishId: string): DishPopularity | undefined => {
        return popularityMap[dishId];
    };

    return { popularityMap, trackView, getPopularity };
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