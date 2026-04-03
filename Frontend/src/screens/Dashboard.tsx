import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ChatMessage } from '@/types/dashboard';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { containerStyle } from '../utils/styles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Camera, History, User, MessageSquare, Home, Edit, X, Heart, Leaf, Wheat, Check, MapPin, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import { Dish, ScannedItem, HistoryItem, Tab, FoodProfile, ALLERGENS, Allergen, DEFAULT_FOOD_PROFILE, DishRating } from '@/types/dashboard';

import { useDishes } from '@/hooks/useDishes';
import { useGloballyLikedDishes } from '@/hooks/useGloballyLikedDishes';
import { useDebounce } from '@/hooks/useDebounce';
import { useDishReviews } from '@/hooks/useDishReviews';
import { useDishAverageRatings } from '@/hooks/useDishAverageRatings';
import { getRecommendations, getPriceRange, normalizePrice } from '../utils/recommendations';
import { searchDishes } from '../utils/search';

// Components
import HomeTab from '@/components/dashboard/HomeTab';
import ResultsTab from '@/components/dashboard/ResultsTab';
import ChatTab from '@/components/dashboard/ChatTab';
import ProfileTab from '@/components/dashboard/ProfileTab';
import HistoryTab from '@/components/dashboard/HistoryTab';
import NavIcon from '@/components/dashboard/NavIcon';
import StarRating from '@/components/ui/StarRating';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const { dishes: allDishes, loading: dishesLoading } = useDishes();
    const { globallyLikedDishes } = useGloballyLikedDishes();
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [favoriteItems, setFavoriteItems] = useState<Dish[]>([]);
    const [unlikedDishIds, setUnlikedDishIds] = useState<number[]>([]);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantLocation, setRestaurantLocation] = useState('');
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [foodProfile, setFoodProfile] = useState<FoodProfile>(DEFAULT_FOOD_PROFILE);

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [showEditFoodProfile, setShowEditFoodProfile] = useState(false);
    const [editFoodProfile, setEditFoodProfile] = useState<FoodProfile>(DEFAULT_FOOD_PROFILE);
    const [isSavingFoodProfile, setIsSavingFoodProfile] = useState(false);

    const [dishRatings, setDishRatings] = useState<Record<string, DishRating>>({});
    const [feedbackComment, setFeedbackComment] = useState('');
    const [userRating, setUserRating] = useState(0);
    const [currentDishFirestoreId, setCurrentDishFirestoreId] = useState<string | null>(null);

    const { reviews: currentDishReviews, averageRating: currentAvgRating, totalReviews: currentTotalReviews } = useDishReviews(currentDishFirestoreId);

    const dishIds = useMemo(() => allDishes.map(d => String(d.id)), [allDishes]);
    const dishAverageRatings = useDishAverageRatings(dishIds);

    React.useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) return;

            try {
                const userDocRef = doc(db, 'users', auth.currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFavoriteItems(data.favorites || []);
                    setHistoryItems(data.history || []);
                    setPhoneNumber(data.phoneNumber || '');
                    setUnlikedDishIds(data.unliked || []);
                    setFoodProfile(data.foodProfile || DEFAULT_FOOD_PROFILE);

                    const updates: any = {};
                    if (!data.fullname && auth.currentUser.displayName) updates.fullname = auth.currentUser.displayName;
                    if (!data.email && auth.currentUser.email) updates.email = auth.currentUser.email;
                    if (!data.uid) updates.uid = auth.currentUser.uid;

                    if (Object.keys(updates).length > 0) {
                        console.log("Repairing user document fields:", updates);
                        await updateDoc(userDocRef, updates);
                    }

                    if (data.dishRatings) {
                        setDishRatings(data.dishRatings);
                    }
                } else {
                    await setDoc(userDocRef, {
                        uid: auth.currentUser.uid,
                        fullname: auth.currentUser.displayName || 'Guest User',
                        email: auth.currentUser.email || '',
                        favorites: [],
                        unliked: [],
                        history: [],
                        foodProfile: DEFAULT_FOOD_PROFILE,
                        createdAt: new Date()
                    }, { merge: true });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, []);

    const toggleRecommendedLike = async (dish: Dish) => {
        if (!auth.currentUser) return;

        const existingFav = favoriteItems.find(item => item.id === dish.id);
        const userDocRef = doc(db, 'users', auth.currentUser.uid);

        try {
            if (existingFav) {
                setFavoriteItems(prev => prev.filter(item => item.id !== dish.id));
                setUnlikedDishIds(prev => [...prev, dish.id]);
                await updateDoc(userDocRef, {
                    favorites: arrayRemove(existingFav),
                    unliked: arrayUnion(dish.id)
                });
            } else {
                const cleanedDish = Object.fromEntries(
                    Object.entries(dish).filter(([, v]) => v !== undefined)
                );
                setFavoriteItems(prev => [...prev, dish]);
                setUnlikedDishIds(prev => prev.filter(id => id !== dish.id));
                await updateDoc(userDocRef, {
                    favorites: arrayUnion(cleanedDish)
                });
            }
        } catch (error) {
            console.error("Error updating favorites:", error);
        }
    };

    const toggleScannedItemLike = async (item: ScannedItem) => {
        if (!auth.currentUser) return;

        const existingFav = favoriteItems.find(fav => fav.name === item.name);
        const userDocRef = doc(db, 'users', auth.currentUser.uid);

        try {
            if (existingFav) {
                setFavoriteItems(prev => prev.filter(fav => fav.name !== item.name));
                if (existingFav.id) {
                    setUnlikedDishIds(prev => [...prev, existingFav.id]);
                    await updateDoc(userDocRef, {
                        favorites: arrayRemove(existingFav),
                        unliked: arrayUnion(existingFav.id)
                    });
                } else {
                    await updateDoc(userDocRef, {
                        favorites: arrayRemove(existingFav)
                    });
                }
            } else {
                const newDish: Dish = {
                    ...item,
                    id: Date.now(),
                    place: item.place || 'Scanned Menu',
                    price: item.price || ''
                };
                const cleanedDish = Object.fromEntries(
                    Object.entries(newDish).filter(([, v]) => v !== undefined)
                );
                setFavoriteItems(prev => [...prev, newDish]);
                await updateDoc(userDocRef, {
                    favorites: arrayUnion(cleanedDish)
                });
            }
        } catch (error) {
            console.error("Error updating favorites for scanned item:", error);
        }
    };

    const deleteHistoryItem = async (item: HistoryItem) => {
        if (!auth.currentUser) return;

        const userDocRef = doc(db, 'users', auth.currentUser.uid);

        try {
            setHistoryItems(prev => prev.filter(i => i.id !== item.id));
            await updateDoc(userDocRef, {
                history: arrayRemove(item)
            });
        } catch (error) {
            console.error("Error deleting history item:", error);
        }
    };

    const saveRating = async (dishName: string, rating: number, comment?: string) => {
        if (!auth.currentUser || rating === 0 || !currentDishFirestoreId) return;

        const reviewRef = doc(db, 'dishes', currentDishFirestoreId, 'reviews', auth.currentUser.uid);

        const reviewData: DishRating = {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Anonymous',
            rating,
            comment: comment || '',
            createdAt: new Date().toISOString()
        };

        try {
            await setDoc(reviewRef, reviewData);

            const ratingKey = `dish_${dishName}`;
            setDishRatings(prev => ({
                ...prev,
                [ratingKey]: reviewData
            }));

            setUserRating(0);
            setFeedbackComment('');
        } catch (error) {
            console.error("Error saving review:", error);
        }
    };

    // -- Data States
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [fullText, setFullText] = useState('');
    const [viewMode, setViewMode] = useState<'items' | 'text'>('items');
    const [selectedDish, setSelectedDish] = useState<ScannedItem | null>(null);

    useEffect(() => {
        if (!selectedDish) {
            setCurrentDishFirestoreId(null);
            return;
        }
        const existing = allDishes.find(
            (d) => d.name.toLowerCase() === selectedDish.name.toLowerCase()
        );
        const dishId = 'id' in selectedDish ? (selectedDish as any).id : undefined;
        const firestoreId = existing
            ? String(existing.id)
            : dishId
                ? String(dishId)
                : selectedDish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setCurrentDishFirestoreId(firestoreId);

        const ratingKey = `dish_${selectedDish.name}`;
        const existingRating = dishRatings[ratingKey];
        setUserRating(existingRating?.rating || 0);
        setFeedbackComment(existingRating?.comment || '');
    }, [selectedDish, allDishes, dishRatings]);

    const [searchText, setSearchText] = useState('');
    const debouncedSearch = useDebounce(searchText, 250);
    const [sortBy, setSortBy] = useState<string>('relevance');
    const [activeFilters, setActiveFilters] = useState<{
        isVegetarian: boolean;
        isVegan: boolean;
        isGlutenFree: boolean;
        budget: string[];
        prepTime: string[];
        cuisine: string[];
        location: string;
        rating: string;
    }>({
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        budget: [],
        prepTime: [],
        cuisine: [],
        location: '',
        rating: ''
    });

    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string } | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
        if (activeFilters.location !== 'nearby' && activeFilters.location !== 'within2km') return;
        if (userLocation) return;

        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
                        { headers: { 'User-Agent': 'MenuVision/1.0' } }
                    );
                    const data = await res.json();
                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
                    setUserLocation({ lat: latitude, lng: longitude, city });
                } catch {
                    setUserLocation({ lat: latitude, lng: longitude, city: '' });
                } finally {
                    setLocationLoading(false);
                }
            },
            () => {
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [activeFilters.location, userLocation]);

    const detectCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported in this browser');
            setTimeout(() => setLocationError(''), 3000);
            return;
        }

        setDetectingLocation(true);
        setLocationError('');

        const tryGeolocation = (highAccuracy: boolean) => {
            return new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: highAccuracy,
                    timeout: 15000,
                    maximumAge: 60000
                });
            });
        };

        try {
            let position: GeolocationPosition;
            try {
                position = await tryGeolocation(false);
            } catch {
                position = await tryGeolocation(true);
            }

            const { latitude, longitude } = position.coords;
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
                { headers: { 'User-Agent': 'MenuVision/1.0' } }
            );

            if (!res.ok) throw new Error('Reverse geocoding failed');

            const data = await res.json();
            const addressParts = [];
            if (data.address?.road) addressParts.push(data.address.road);
            if (data.address?.neighbourhood) addressParts.push(data.address.neighbourhood);
            if (data.address?.city || data.address?.town || data.address?.village) {
                addressParts.push(data.address.city || data.address.town || data.address.village);
            }
            if (data.address?.country) addressParts.push(data.address.country);
            
            if (addressParts.length > 0) {
                setRestaurantLocation(addressParts.join(', '));
            } else {
                setLocationError('Could not resolve address for your location');
                setTimeout(() => setLocationError(''), 3000);
            }
        } catch (err: any) {
            if (err?.code === 1) {
                setLocationError('Location permission denied. Please allow location access in browser settings.');
            } else if (err?.code === 2) {
                setLocationError('Location unavailable. Please ensure location services are enabled.');
            } else if (err?.code === 3) {
                setLocationError('Location request timed out. Please try again.');
            } else {
                setLocationError('Could not detect location. Please enter manually.');
            }
            setTimeout(() => setLocationError(''), 5000);
        } finally {
            setDetectingLocation(false);
        }
    };

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: 1, text: "Hello! I am your MenuVision. Ask me about food, ingredients, or anything on the menu!", sender: 'bot' }
    ]);
    const [chatInput, setChatInput] = useState('');

    const recommendedDishes = useMemo(() => {
        console.log('Computing recommendations:', {
            allDishesCount: allDishes.length,
            favoriteItemsCount: favoriteItems.length,
            unlikedDishIdsCount: unlikedDishIds.length,
            globallyLikedDishesCount: globallyLikedDishes?.length,
            foodProfile
        });
        const result = getRecommendations(allDishes, favoriteItems, unlikedDishIds, 10, globallyLikedDishes, foodProfile);
        console.log('Recommendations result:', result.length, 'dishes');
        return result;
    }, [allDishes, favoriteItems, unlikedDishIds, globallyLikedDishes, foodProfile]);

    const searchableDishes = useMemo(() => {
        const seen = new Set<string>();
        const pool: Dish[] = [];

        const addDish = (dish: Dish) => {
            const key = `${dish.name.toLowerCase()}__${(dish.place || '').toLowerCase()}`;
            if (!seen.has(key)) {
                seen.add(key);
                pool.push(dish);
            }
        };

        allDishes.forEach(addDish);
        favoriteItems.forEach(addDish);
        historyItems.forEach(item => {
            if (item.scannedItems) {
                item.scannedItems.forEach((scanned, idx) => {
                    const dish: Dish = {
                        ...scanned,
                        id: item.id * 1000 + idx,
                        place: scanned.place || item.place || 'Scanned Menu',
                        price: scanned.price || ''
                    };
                    addDish(dish);
                });
            }
        });

        return pool;
    }, [allDishes, favoriteItems, historyItems]);

    const filteredDishes = useMemo(() => {
        const baseList = debouncedSearch.trim()
            ? searchDishes(searchableDishes, debouncedSearch)
            : recommendedDishes;

        let results = baseList;

        results = results.filter(dish => {
        const matchesVegetarian = !activeFilters.isVegetarian || dish.isVegetarian;
        const matchesVegan = !activeFilters.isVegan || dish.isVegan;
        const matchesGlutenFree = !activeFilters.isGlutenFree || dish.isGlutenFree;
        
        const budgetValue = dish.priceRange || getPriceRange(dish.price);
        const matchesBudget = activeFilters.budget.length === 0 || 
            activeFilters.budget.includes(budgetValue);
        
        const cuisineValue = dish.cuisine || dish.origin;
        const matchesCuisine = activeFilters.cuisine.length === 0 || 
            (cuisineValue && activeFilters.cuisine.some(c => cuisineValue.toLowerCase().includes(c.toLowerCase())));
        
        const matchesPrepTime = activeFilters.prepTime.length === 0 || 
            (dish.prepTime && activeFilters.prepTime.some(pt => {
                const prepMins = parseInt(dish.prepTime?.replace(/\D/g, '') || '0');
                if (pt === 'under15') return prepMins < 15;
                if (pt === 'under30') return prepMins < 30;
                return true;
            }));

        let matchesLocation = true;
        if (activeFilters.location === 'kathmandu') {
            matchesLocation = !!dish.location && dish.location.toLowerCase().includes('kathmandu');
        } else if (activeFilters.location === 'nearby') {
            if (userLocation?.city) {
                const loc = (dish.location || '').toLowerCase();
                const city = userLocation.city.toLowerCase();
                matchesLocation = loc.includes(city);
            } else {
                matchesLocation = !locationLoading;
            }
        } else if (activeFilters.location === 'within2km') {
            if (dish.latitude != null && dish.longitude != null && userLocation) {
                const R = 6371;
                const dLat = (dish.latitude - userLocation.lat) * Math.PI / 180;
                const dLng = (dish.longitude - userLocation.lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(dish.latitude * Math.PI / 180) *
                    Math.sin(dLng / 2) ** 2;
                const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                matchesLocation = dist <= 2;
            } else if (userLocation?.city) {
                const loc = (dish.location || '').toLowerCase();
                const city = userLocation.city.toLowerCase();
                matchesLocation = loc.includes(city);
            } else {
                matchesLocation = !locationLoading;
            }
        }

        let matchesRating = true;
        if (activeFilters.rating) {
            const ratingKey = `dish_${dish.name}`;
            const dishRating = dishRatings[ratingKey]?.rating || 0;
            if (activeFilters.rating === 'rated') {
                matchesRating = dishRating > 0;
            } else {
                const minRating = parseFloat(activeFilters.rating);
                matchesRating = dishRating >= minRating;
            }
        }

        return matchesVegetarian && matchesVegan && matchesGlutenFree && matchesBudget && matchesCuisine && matchesPrepTime && matchesLocation && matchesRating;
        });

        if (sortBy === 'price-low') {
            results.sort((a, b) => {
                const priceA = parseFloat((a.price || '0').replace(/[^0-9.]/g, '')) || 0;
                const priceB = parseFloat((b.price || '0').replace(/[^0-9.]/g, '')) || 0;
                return priceA - priceB;
            });
        } else if (sortBy === 'price-high') {
            results.sort((a, b) => {
                const priceA = parseFloat((a.price || '0').replace(/[^0-9.]/g, '')) || 0;
                const priceB = parseFloat((b.price || '0').replace(/[^0-9.]/g, '')) || 0;
                return priceB - priceA;
            });
        } else if (sortBy === 'rating') {
            results.sort((a, b) => {
                const ratingA = dishRatings[`dish_${a.name}`]?.rating || 0;
                const ratingB = dishRatings[`dish_${b.name}`]?.rating || 0;
                return ratingB - ratingA;
            });
        } else if (sortBy === 'prep-time') {
            results.sort((a, b) => {
                const timeA = parseInt(a.prepTime?.replace(/\D/g, '') || '999');
                const timeB = parseInt(b.prepTime?.replace(/\D/g, '') || '999');
                return timeA - timeB;
            });
        }

        return results;
    }, [recommendedDishes, searchableDishes, debouncedSearch, activeFilters, dishRatings, sortBy]);

    // -- Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // -- Helper to resize images for API compliance
    const resizeImage = (blob: Blob): Promise<Blob> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                const MAX_DIM = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_DIM) {
                        height *= MAX_DIM / width;
                        width = MAX_DIM;
                    }
                } else {
                    if (height > MAX_DIM) {
                        width *= MAX_DIM / height;
                        height = MAX_DIM;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((resizedBlob) => {
                    resolve(resizedBlob || blob);
                }, 'image/jpeg', 0.8);
            };
            img.onerror = () => resolve(blob);
        });
    };

    // --- Helper to convert Blob to Base64 ---
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // --- ANALYZE MENU (BACKEND) ---
    const analyzeMenu = async () => {
        if (!imageBlob || analyzing) return;

        setAnalyzing(true);
        try {
            // 1. Convert Blob to Base64 for sending to backend
            const base64Image = await blobToBase64(imageBlob);

            // 2. Call Backend API
            const response = await fetch('/api/analyzeMenu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageUrl: base64Image,
                    userId: auth.currentUser ? auth.currentUser.uid : 'anonymous'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific errors
                if (response.status === 429) {
                    throw new Error("Quota limit reached. Please wait a moment.");
                } else {
                    throw new Error(data.error || "Failed to analyze menu");
                }
            }

            console.log("Analysis Result:", data);
            console.log("Menu items with images:", data.menuItems?.map((item: any) => ({ name: item.name, imageUrl: item.imageUrl })));

            const items: ScannedItem[] = (data.menuItems || []).map((item: any) => ({
                name: item.name,
                price: item.price || 'Price not available',
                place: restaurantName || 'Scanned Menu',
                location: restaurantLocation || '',
                calories: item.calories ? `${item.calories} kcal` : undefined,
                prepTime: item.prepTime || item.preparationTime || item.cookingTime,
                ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients,
                description: item.description,
                imageUrl: item.imageUrl,
                allergens: item.allergens,
                isVegan: item.isVegan,
                isVegetarian: item.isVegetarian,
                isGlutenFree: item.isGlutenFree,
                origin: item.origin,
                cuisine: item.origin,
                category: item.category
            }));
            const extractedText = data.fullText || "";

            if (items.length > 0) {
                const sanitizedItems = items.map((item: ScannedItem) => 
                    Object.fromEntries(
                        Object.entries(item).filter(([_, v]) => v !== undefined)
                    )
                ) as ScannedItem[];
                
                const newHistoryItem: HistoryItem = {
                    id: Date.now(),
                    place: restaurantName || 'Scanned Menu',
                    location: restaurantLocation || '',
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    items: items.slice(0, 2).map(i => i.name).join(', ') + (items.length > 2 ? '...' : ''),
                    total: `${items.length} dishes found`,
                    scannedItems: sanitizedItems
                };

                setHistoryItems(prev => [newHistoryItem, ...prev]);

                // Persist to Firestore
                if (auth.currentUser) {
                    const userDocRef = doc(db, 'users', auth.currentUser.uid);
                    await updateDoc(userDocRef, {
                        history: arrayUnion(newHistoryItem)
                    }).catch(async (error) => {
                        if (error.code === 'not-found') {
                            await setDoc(userDocRef, {
                                history: [newHistoryItem],
                                favorites: []
                            }, { merge: true });
                        }
                    });
                }

                setFullText(extractedText);
                setScannedItems(items);
                setCapturedImage(null);
                setRestaurantName('');
                setRestaurantLocation('');
                setActiveTab("results");
                setViewMode('items');
            } else {
                alert("No menu items found. Please try again.");
                setFullText(extractedText);
                setActiveTab("results");
                setViewMode('text');
            }

        } catch (err: any) {
            console.error("Analysis Error:", err);
            alert("Error: " + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    // --- Camera Logic ---
    const startCamera = async () => {
        setIsCameraOpen(true);
        setShowScanOptions(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert("Camera access denied.");
            setIsCameraOpen(false);
        }
    };

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const resizedBlob = await resizeImage(blob);
                        setImageBlob(resizedBlob);
                        setCapturedImage(URL.createObjectURL(resizedBlob));
                    }
                }, 'image/jpeg', 0.9);
                stopCamera();
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    // Cleanup object URLs to prevent memory leaks
    React.useEffect(() => {
        return () => {
            if (capturedImage && capturedImage.startsWith('blob:')) {
                URL.revokeObjectURL(capturedImage);
            }
        };
    }, [capturedImage]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const resizedBlob = await resizeImage(file);
            setImageBlob(resizedBlob);
            setCapturedImage(URL.createObjectURL(resizedBlob));
            setShowScanOptions(false);
        }
    };

    const sendMessage = async () => {
        const trimmed = chatInput.trim();
        if (!trimmed) return;

        const userMsg: ChatMessage = { id: Date.now(), text: trimmed, sender: 'user' };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: trimmed }),
            });
            const data = await response.json();
            const replyText = data.success && data.data
                ? Object.entries(data.data)
                    .map(([k, v]) => `**${k}**: ${Array.isArray(v) ? (v as string[]).join(', ') : v ?? 'N/A'}`)
                    .join('\n')
                : (data.error || 'Sorry, I could not get a response.');
            const botMsg: ChatMessage = {
                id: Date.now() + 1,
                text: replyText,
                sender: 'bot',
                imageUrl: data.imageUrl ?? null,
            };
            setChatMessages(prev => [...prev, botMsg]);
        } catch {
            const botMsg: ChatMessage = { id: Date.now() + 1, text: 'Sorry, there was an error connecting to the AI.', sender: 'bot' };
            setChatMessages(prev => [...prev, botMsg]);
        }
    };

    const handleOpenEditProfile = () => {
        setEditName(auth.currentUser?.displayName || '');
        setEditPhone(phoneNumber || '');
        setShowEditProfile(true);
    };

    const handleSaveProfile = async () => {
        if (!auth.currentUser) return;
        setIsSavingProfile(true);

        try {
            if (editName !== auth.currentUser.displayName) {
                await updateProfile(auth.currentUser, {
                    displayName: editName
                });
            }

            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await setDoc(userDocRef, {
                phoneNumber: editPhone
            }, { merge: true });

            setPhoneNumber(editPhone);
            setShowEditProfile(false);

        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleOpenEditFoodProfile = () => {
        setEditFoodProfile({ ...foodProfile });
        setShowEditFoodProfile(true);
    };

    const toggleEditDietary = (key: 'isVegetarian' | 'isVegan' | 'isGlutenFree') => {
        setEditFoodProfile(prev => {
            const newValue = !prev[key];
            if (key === 'isVegan' && newValue) {
                return { ...prev, isVegan: true, isVegetarian: true };
            }
            if (key === 'isVegetarian' && !newValue && prev.isVegan) {
                return { ...prev, isVegetarian: false, isVegan: false };
            }
            return { ...prev, [key]: newValue };
        });
    };

    const toggleEditAllergen = (allergen: Allergen) => {
        setEditFoodProfile(prev => ({
            ...prev,
            allergens: prev.allergens.includes(allergen)
                ? prev.allergens.filter(a => a !== allergen)
                : [...prev.allergens, allergen]
        }));
    };

    const handleSaveFoodProfile = async () => {
        if (!auth.currentUser) return;
        setIsSavingFoodProfile(true);

        try {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await setDoc(userDocRef, {
                foodProfile: {
                    ...editFoodProfile,
                    onboardingCompleted: true
                }
            }, { merge: true });

            setFoodProfile(editFoodProfile);
            setShowEditFoodProfile(false);

        } catch (error) {
            console.error("Error saving food profile:", error);
            alert("Failed to save food preferences. Please try again.");
        } finally {
            setIsSavingFoodProfile(false);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <div className={containerStyle + " flex flex-col shadow-2xl relative overflow-hidden"}>
                {dishesLoading && (
                    <div className="absolute inset-0 bg-white/80 z-[200] flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Loading dishes...</p>
                        </div>
                    </div>
                )}
                <main className="flex-1 overflow-y-auto z-[3] relative custom-scrollbar">
                    {activeTab === 'home' && (
                        <HomeTab
                            searchText={searchText}
                            setSearchText={setSearchText}
                            setShowScanOptions={setShowScanOptions}
                            filteredDishes={filteredDishes}
                            favoriteItems={favoriteItems}
                            toggleRecommendedLike={toggleRecommendedLike}
                            onSelectDish={(dish) => setSelectedDish(dish as ScannedItem)}
                            dishRatings={dishRatings}
                            dishAverageRatings={dishAverageRatings}
                            activeFilters={activeFilters}
                            setActiveFilters={setActiveFilters}
                            locationLoading={locationLoading}
                            allDishes={searchableDishes}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                        />
                    )}
                    {activeTab === 'results' && (
                        <ResultsTab
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            scannedItems={scannedItems}
                            setSelectedDish={setSelectedDish}
                            fullText={fullText}
                            setActiveTab={setActiveTab}
                            favoriteItems={favoriteItems}
                            onToggleLike={toggleScannedItemLike}
                            dishRatings={dishRatings}
                        />
                    )}
                    {activeTab === 'chat' && (
                        <ChatTab
                            chatMessages={chatMessages}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            sendMessage={sendMessage}
                        />
                    )}
                    {activeTab === 'profile' && (
                        <ProfileTab
                            user={auth.currentUser}
                            phoneNumber={phoneNumber}
                            foodProfile={foodProfile}
                            setShowEditProfile={handleOpenEditProfile}
                            setShowEditFoodProfile={handleOpenEditFoodProfile}
                            onLogout={onLogout}
                        />
                    )}
                    {activeTab === 'history' && (
                        <HistoryTab
                            historyItems={historyItems}
                            favoriteItems={favoriteItems}
                            toggleLike={toggleRecommendedLike}
                            onDeleteHistoryItem={deleteHistoryItem}
                            onSelectHistoryItem={(item) => {
                                if (item.scannedItems && item.scannedItems.length > 0) {
                                    setScannedItems(item.scannedItems);
                                    setActiveTab('results');
                                    setViewMode('items');
                                    setFullText("");
                                } else {
                                    alert("No detailed items found for this scan.");
                                }
                            }}
                            onSelectFavorite={(dish) => setSelectedDish(dish as ScannedItem)}
                            dishRatings={dishRatings}
                        />
                    )}
                </main>

                <nav className="h-20 bg-white/95 backdrop-blur-xl flex items-center px-4 z-[10] border-t border-gray-200">
                    <NavIcon name="home" label="Home" icon={<Home size={activeTab === 'home' ? 24 : 22} />} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <NavIcon name="chat" label="Chat" icon={<MessageSquare size={activeTab === 'chat' ? 24 : 22} />} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <NavIcon name="history" label="History" icon={<History size={activeTab === 'history' ? 24 : 22} />} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <NavIcon name="profile" label="Me" icon={<User size={activeTab === 'profile' ? 24 : 22} />} activeTab={activeTab} setActiveTab={setActiveTab} />
                </nav>

                {/* Overlays / Dialogs */}
                <Dialog open={showScanOptions} onOpenChange={setShowScanOptions}>
                    <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Camera className="text-amber-500" /> Choose Import
                            </DialogTitle>
                            <DialogDescription>Capture a new photo or upload an existing image of your menu.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Button onClick={startCamera} className="h-16 rounded-2xl gap-3 bg-black hover:bg-gray-800 text-lg font-bold">
                                <Camera /> Take Photo
                            </Button>
                            <div className="relative group">
                                <Button variant="outline" className="w-full h-16 rounded-2xl gap-3 border-gray-200 hover:bg-gray-50 text-lg font-bold">
                                    <Edit size={20} /> Choose from Library
                                </Button>
                                <Input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setShowScanOptions(false)} className="w-full text-gray-400">Cancel</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                    <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
                            <DialogDescription>Update your personal information and contact details.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 py-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    placeholder="John Doe"
                                    className="h-12 rounded-xl"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    placeholder="98XXXXXXXX"
                                    className="h-12 rounded-xl"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex sm:flex-row gap-2">
                            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex-1 h-12 rounded-xl bg-black font-bold">
                                {isSavingProfile ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button variant="outline" onClick={() => setShowEditProfile(false)} disabled={isSavingProfile} className="flex-1 h-12 rounded-xl border-gray-200 font-bold">Cancel</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showEditFoodProfile} onOpenChange={setShowEditFoodProfile}>
                    <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Edit Food Preferences</DialogTitle>
                            <DialogDescription>Update your dietary preferences and food allergens.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 py-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dietary Preferences</Label>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => toggleEditDietary('isVegetarian')}
                                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${editFoodProfile.isVegetarian
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${editFoodProfile.isVegetarian ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <Leaf size={20} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-gray-900">Vegetarian</div>
                                        </div>
                                        {editFoodProfile.isVegetarian && <Check size={18} className="text-green-500" />}
                                    </button>

                                    <button
                                        onClick={() => toggleEditDietary('isVegan')}
                                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${editFoodProfile.isVegan
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${editFoodProfile.isVegan ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <span className="text-lg">🌱</span>
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-gray-900">Vegan</div>
                                        </div>
                                        {editFoodProfile.isVegan && <Check size={18} className="text-green-500" />}
                                    </button>

                                    <button
                                        onClick={() => toggleEditDietary('isGlutenFree')}
                                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${editFoodProfile.isGlutenFree
                                            ? 'border-amber-500 bg-amber-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${editFoodProfile.isGlutenFree ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <Wheat size={20} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-gray-900">Gluten-Free</div>
                                        </div>
                                        {editFoodProfile.isGlutenFree && <Check size={18} className="text-amber-500" />}
                                    </button>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Food Allergens</Label>
                                <div className="flex flex-wrap gap-2">
                                    {ALLERGENS.map((allergen) => (
                                        <button
                                            key={allergen}
                                            onClick={() => toggleEditAllergen(allergen)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${editFoodProfile.allergens.includes(allergen)
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {allergen}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="flex sm:flex-row gap-2">
                            <Button onClick={handleSaveFoodProfile} disabled={isSavingFoodProfile} className="flex-1 h-12 rounded-xl bg-black font-bold">
                                {isSavingFoodProfile ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button variant="outline" onClick={() => setShowEditFoodProfile(false)} disabled={isSavingFoodProfile} className="flex-1 h-12 rounded-xl border-gray-200 font-bold">Cancel</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!selectedDish} onOpenChange={() => setSelectedDish(null)}>
                    <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-h-[90vh]">
                        <div className="h-32 bg-amber-400 relative shrink-0">
                            {selectedDish?.imageUrl ? (
                                <img src={selectedDish.imageUrl} alt={selectedDish.name} className="w-full h-full object-cover" />
                            ) : null}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedDish(null)}
                                className="absolute top-4 right-4 text-black hover:bg-black/10 rounded-full"
                            >
                                <X size={24} />
                            </Button>
                            <div className="absolute -bottom-10 left-8">
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl">🍲</div>
                            </div>
                        </div>
                        <div className="p-8 pt-12 overflow-y-auto max-h-[calc(90vh-8rem)] custom-scrollbar">
                            <DialogHeader className="sr-only">
                                <DialogTitle>{selectedDish?.name}</DialogTitle>
                                <DialogDescription>Details about {selectedDish?.name}, including ingredients and price.</DialogDescription>
                            </DialogHeader>
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-3xl font-black text-black">{selectedDish?.name}</h2>
                                {selectedDish && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 shrink-0 rounded-full hover:bg-gray-100"
                                        onClick={() => toggleScannedItemLike(selectedDish)}
                                    >
                                        <Heart
                                            size={28}
                                            className={favoriteItems.some(fav => fav.name === selectedDish.name) ? "fill-red-500 text-red-500" : "text-gray-400"}
                                        />
                                    </Button>
                                )}
                            </div>
                            <div className="text-green-600 text-xl font-bold mb-2">{selectedDish?.price}</div>
                            {selectedDish?.place && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
                                    <MapPin size={14} /> {selectedDish.place}{selectedDish.location ? `, ${selectedDish.location}` : ''}
                                </p>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Ingredients</Label>
                                    <p className="text-gray-700 leading-relaxed mt-1">{selectedDish?.ingredients || 'No ingredients listed'}</p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Calories</Label>
                                        <p className="text-gray-900 font-bold mt-1 text-lg">{selectedDish?.calories || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Prep Time</Label>
                                        <p className="text-gray-900 font-bold mt-1 text-lg">{selectedDish?.prepTime || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Origin</Label>
                                        <p className="text-gray-900 font-bold mt-1 text-lg">{selectedDish?.origin || 'Various'}</p>
                                    </div>
                                </div>
                                {(selectedDish?.isVegan || selectedDish?.isVegetarian || selectedDish?.isGlutenFree) && (
                                    <>
                                        <Separator />
                                        <div>
                                            <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Dietary</Label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedDish?.isVegan && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">🌱 Vegan</span>}
                                                {selectedDish?.isVegetarian && !selectedDish?.isVegan && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">🥬 Vegetarian</span>}
                                                {selectedDish?.isGlutenFree && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">🌾 Gluten-Free</span>}
                                            </div>
                                        </div>
                                    </>
                                )}
                                {selectedDish?.allergens && selectedDish.allergens.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Allergens</Label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedDish.allergens.map((allergen, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">{allergen}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <Separator />
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Description</Label>
                                    <p className="text-gray-600 leading-relaxed mt-1 italic">"{selectedDish?.description || 'A delicious dish prepared with fresh ingredients.'}"</p>
                                </div>

                                <Separator />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Ratings & Reviews</Label>
                                        {currentTotalReviews > 0 && (
                                            <span className="text-xs text-gray-400">{currentTotalReviews} {currentTotalReviews === 1 ? 'review' : 'reviews'}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                        <span className="text-4xl font-black text-amber-600">{currentAvgRating || '—'}</span>
                                        <div>
                                            <StarRating rating={currentAvgRating} readonly size={20} />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {currentTotalReviews > 0
                                                    ? `Based on ${currentTotalReviews} ${currentTotalReviews === 1 ? 'review' : 'reviews'}`
                                                    : 'No reviews yet'}
                                            </p>
                                        </div>
                                    </div>

                                    {currentDishReviews.filter(r => r.userId === auth.currentUser?.uid).map((review) => (
                                        <div key={review.id} className="bg-green-50 border border-green-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-green-700">Your review</span>
                                                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <StarRating rating={review.rating} readonly size={16} />
                                            {review.comment && (
                                                <p className="text-sm text-gray-600 italic mt-2">"{review.comment}"</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">Edit your review below</p>
                                        </div>
                                    ))}

                                    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                                        <div className="flex flex-col items-center gap-2">
                                            <StarRating
                                                rating={userRating}
                                                onRatingChange={setUserRating}
                                                size={32}
                                            />
                                            <span className="text-sm text-gray-500">
                                                {userRating > 0 ? `${userRating} star${userRating !== 1 ? 's' : ''}` : 'Tap to rate'}
                                            </span>
                                        </div>
                                        {userRating > 0 && (
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Add a comment (optional)"
                                                    value={feedbackComment}
                                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                                    className="h-12 rounded-xl"
                                                />
                                                <Button
                                                    onClick={() => saveRating(selectedDish?.name || '', userRating, feedbackComment)}
                                                    className="w-full h-10 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-500"
                                                >
                                                    <Send size={16} className="mr-2" /> Submit Rating
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {currentDishReviews.filter(r => r.userId !== auth.currentUser?.uid).length > 0 && (
                                        <div className="space-y-3">
                                            <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                                                All Reviews ({currentDishReviews.filter(r => r.userId !== auth.currentUser?.uid).length})
                                            </Label>
                                            {currentDishReviews
                                                .filter(r => r.userId !== auth.currentUser?.uid)
                                                .map((review) => (
                                                    <div key={review.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-semibold text-gray-700">{review.userName}</span>
                                                            <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <StarRating rating={review.rating} readonly size={14} />
                                                        {review.comment && (
                                                            <p className="text-sm text-gray-600 mt-2">"{review.comment}"</p>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 pt-0 mt-4">
                            <Button onClick={() => setSelectedDish(null)} className="w-full h-14 rounded-2xl bg-black text-white text-lg font-bold">Got it!</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
                    <DialogContent className="max-w-4xl p-0 h-[80vh] bg-black border-none overflow-hidden rounded-3xl">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Camera View</DialogTitle>
                            <DialogDescription>Live camera stream to capture and analyze the menu.</DialogDescription>
                        </DialogHeader>
                        <div className="relative w-full h-full flex flex-col shadow-2xl">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            <div className="absolute top-6 right-6 z-50">
                                <Button variant="ghost" size="icon" onClick={stopCamera} className="bg-white/20 backdrop-blur-md text-white hover:bg-white/40 rounded-full h-12 w-12">
                                    <X size={28} />
                                </Button>
                            </div>

                            <div className="absolute bottom-10 left-0 w-full flex justify-center items-center gap-8 z-50 px-6">
                                <div className="flex-1" />
                                <div className="relative">
                                    <div className="absolute -inset-2 rounded-full border-2 border-white/50 animate-ping opacity-20" />
                                    <button
                                        onClick={takePhoto}
                                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all outline-none"
                                    />
                                </div>
                                <div className="flex-1 flex justify-end">
                                    <div className="text-white text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest">Live Menu View</div>
                                </div>
                            </div>

                            <div className="absolute inset-0 border-[40px] border-black/10 pointer-events-none">
                                <div className="w-full h-full border-2 border-white/20 rounded-xl relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400" />
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {capturedImage && (
                    <div className="absolute inset-0 bg-black/95 z-[150] flex flex-col items-center justify-center p-6 animate-fade">
                        <Card className="max-w-sm w-full bg-transparent border-none shadow-none overflow-hidden">
                            <CardContent className="p-0">
                                <img src={capturedImage} alt="Preview" className="w-full rounded-3xl shadow-2xl border border-white/10" />
                            </CardContent>
                        </Card>
                        <div className="flex flex-col gap-3 mt-12 w-full max-w-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="Restaurant Name"
                                    value={restaurantName}
                                    onChange={(e) => setRestaurantName(e.target.value)}
                                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl text-lg backdrop-blur-md"
                                />
                                <div className="relative">
                                    <Input
                                        placeholder="Location"
                                        value={restaurantLocation}
                                        onChange={(e) => setRestaurantLocation(e.target.value)}
                                        className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl text-lg backdrop-blur-md pr-20"
                                    />
                                    <Button
                                        type="button"
                                        onClick={detectCurrentLocation}
                                        disabled={detectingLocation}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 rounded-xl text-xs font-medium disabled:opacity-50"
                                    >
                                        {detectingLocation ? 'Detecting...' : 'Detect'}
                                    </Button>
                                </div>
                                {locationError && (
                                    <p className="text-red-400 text-xs mt-1">{locationError}</p>
                                )}
                            </div>
                            <Button onClick={analyzeMenu} disabled={analyzing} className="h-16 rounded-2xl bg-amber-400 text-black hover:bg-amber-500 text-lg font-black shadow-[0_10px_30px_rgba(251,191,36,0.3)] disabled:opacity-50 transition-all">
                                {analyzing ? "Reading Menu..." : "Analyze This Menu"}
                            </Button>
                            <Button variant="ghost" onClick={() => {
                                setCapturedImage(null);
                                setImageBlob(null);
                                setRestaurantName('');
                                setRestaurantLocation('');
                            }} disabled={analyzing} className="h-12 text-white/60 hover:text-white font-bold disabled:opacity-50">
                                Retake Photo
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
