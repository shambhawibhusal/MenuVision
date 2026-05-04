import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ChatMessage } from '@/types/dashboard';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { containerStyle } from '../utils/styles';
import { useTouchScroll } from '@/hooks/useTouchScroll';
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

import { Dish, ScannedItem, HistoryItem, Tab, FoodProfile, ALLERGENS, Allergen, DEFAULT_FOOD_PROFILE, DishRating, MealType } from '@/types/dashboard';

import { useDishes } from '@/hooks/useDishes';
import { useGloballyLikedDishes } from '@/hooks/useGloballyLikedDishes';
import { useDebounce } from '@/hooks/useDebounce';
import { useDishReviews } from '@/hooks/useDishReviews';
import { useDishAverageRatings } from '@/hooks/useDishAverageRatings';
import { useMealLog } from '@/hooks/useMealLog';
import { useDishPopularity } from '@/hooks/useDishPopularity';
import { useRestaurantReviews } from '@/hooks/useRestaurantReviews';
import { useToast, ToastContainer } from '@/hooks/useToast';
import { getRecommendations, getPriceRange } from '../utils/recommendations';
import { searchDishes, groupDishesByName, groupDishesByRestaurant } from '../utils/search';
import { formatPrepTime, formatDate } from '../utils/formatters';
import { checkDishInDataset, addDishToDataset, incrementScanCount, getDishById, resolveScannedItems } from '../services/menuDataset';
import { incrementRestaurantScanCount } from '../services/restaurants';
import { addRestaurantReview } from '../services/restaurants';

// Components
import HomeTab from '@/components/dashboard/HomeTab';
import ResultsTab from '@/components/dashboard/ResultsTab';
import ChatTab from '@/components/dashboard/ChatTab';
import ProfileTab from '@/components/dashboard/ProfileTab';
import HistoryTab from '@/components/dashboard/HistoryTab';
import MealLogTab from '@/components/dashboard/MealLogTab';
import NavIcon from '@/components/dashboard/NavIcon';
import StarRating from '@/components/ui/StarRating';
import { LocationMap } from '@/components/dashboard/LocationMap';
import ImagePreviewModal from '@/components/ui/ImagePreviewModal';

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

    const [showRestaurantRatingModal, setShowRestaurantRatingModal] = useState(false);
    const [selectedRestaurantForRating, setSelectedRestaurantForRating] = useState<{ place: string; location: string } | null>(null);
    const [restaurantRating, setRestaurantRating] = useState(0);
    const [restaurantComment, setRestaurantComment] = useState('');
    const [isSavingRestaurantReview, setIsSavingRestaurantReview] = useState(false);
    const [selectedHistoryRestaurant, setSelectedHistoryRestaurant] = useState<{ place: string; location: string } | null>(null);

    const [showRestaurantReviewsModal, setShowRestaurantReviewsModal] = useState(false);
    const [resolvedRecommendedDishes, setResolvedRecommendedDishes] = useState<Dish[]>([]);
    const [resolvedSearchableDishes, setResolvedSearchableDishes] = useState<Dish[]>([]);
    const [selectedLocationDish, setSelectedLocationDish] = useState<Dish | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

    const { reviews: currentDishReviews, averageRating: currentAvgRating, totalReviews: currentTotalReviews } = useDishReviews(currentDishFirestoreId);
    
    const { addToLog, isInLog: isDishInMealLog, todayLog } = useMealLog();
    const { toasts, showToast, removeToast } = useToast();
    const { containerRef } = useTouchScroll({ enabled: true, speed: 1 });

    const dishIds = useMemo(() => allDishes.map(d => d.datasetId || String(d.id)), [allDishes]);
    const dishAverageRatings = useDishAverageRatings(dishIds);
    const { popularityMap } = useDishPopularity(dishIds);

    React.useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) return;

            try {
                const userDocRef = doc(db, 'users', auth.currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFavoriteItems(data.favorites || []);
                    
                    // Migrate old history items to add sortDate
                    const history = (data.history || []).map((item: HistoryItem) => {
                        if (!item.sortDate) {
                            // Parse display date "03 May 2026" to "2026-05-03"
                            const parts = item.date?.match(/(\d{2})\s+(\w+)\s+(\d{4})/);
                            if (parts) {
                                const months: Record<string, string> = {
                                    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                                    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                                    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                                };
                                const day = parts[1];
                                const month = months[parts[2]] || '01';
                                const year = parts[3];
                                return { ...item, sortDate: `${year}-${month}-${day}` };
                            }
                        }
                        return item;
                    });
                    setHistoryItems(history);
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
                // Store minimal data: datasetId + name + price (reference-based)
                const newDish: Dish = {
                    id: Date.now(),
                    datasetId: item.datasetId,
                    name: item.name,
                    price: item.price || '',
                    place: item.place || 'Scanned Menu',
                    location: item.location
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

        try {
            await addDoc(collection(db, 'reviews'), {
                dishId: currentDishFirestoreId,
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || 'Anonymous',
                rating,
                comment: comment || '',
                createdAt: serverTimestamp()
            });

            const ratingKey = `dish_${dishName.toLowerCase().trim()}`;
            const localReviewData: DishRating = {
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || 'Anonymous',
                rating,
                comment: comment || '',
                createdAt: new Date().toISOString()
            };
            const newDishRatings = {
                ...dishRatings,
                [ratingKey]: localReviewData
            };
            
            setDishRatings(newDishRatings);
            
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, { dishRatings: newDishRatings });

            setUserRating(0);
            setFeedbackComment('');
        } catch (error) {
            console.error("Error saving review:", error);
        }
    };

    const saveRestaurantReview = async () => {
        if (!auth.currentUser || !selectedRestaurantForRating || restaurantRating === 0) return;

        setIsSavingRestaurantReview(true);

        const restaurantId = `${selectedRestaurantForRating.place}_${selectedRestaurantForRating.location}`;

        const success = await addRestaurantReview({
            restaurantId,
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Anonymous',
            rating: restaurantRating,
            comment: restaurantComment
        });

        if (success) {
            setShowRestaurantRatingModal(false);
            setRestaurantRating(0);
            setRestaurantComment('');
            setSelectedRestaurantForRating(null);
            showToast('Restaurant rated successfully!', 'success');
        } else {
            showToast('Failed to save review', 'error');
        }

        setIsSavingRestaurantReview(false);
    };

    // -- Data States
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [fullText, setFullText] = useState('');
    const [viewMode, setViewMode] = useState<'items' | 'text'>('items');
    const [selectedDish, setSelectedDish] = useState<ScannedItem | null>(null);
    const restaurantIdForModal = selectedDish?.place && selectedDish.place !== 'Scanned Menu' 
        ? `${selectedDish.place}_${selectedDish.location || ''}` 
        : '';
    const restaurantData = useRestaurantReviews(restaurantIdForModal || null);
    const restaurantReviews = restaurantData?.reviews ?? [];
    const restaurantAvgRating = restaurantData?.averageRating ?? 0;
    const restaurantTotalReviews = restaurantData?.totalReviews ?? 0;
    const restaurantReviewsLoading = restaurantData?.loading ?? false;
    
    const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);

    useEffect(() => {
        if (!selectedDish) {
            setCurrentDishFirestoreId(null);
            return;
        }
        const selectedDishName = selectedDish?.name || '';
        const existing = allDishes.find(
            (d) => (d.name || '').toLowerCase() === selectedDishName.toLowerCase()
        );
        const dishId = 'id' in selectedDish ? (selectedDish as any).id : undefined;
        const firestoreId = existing
            ? String(existing.id)
            : dishId
                ? String(dishId)
                : selectedDishName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setCurrentDishFirestoreId(firestoreId);

        const ratingKey = `dish_${selectedDishName}`;
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
            
            // Save coordinates to state for use when saving scanned items
            setUserLocation({ lat: latitude, lng: longitude, city: '' });
            
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

    const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&accept-language=en`,
                { 
                    headers: { 
                        'User-Agent': 'MenuVision/1.0',
                        'Referer': 'https://menuvision.app'
                    } 
                }
            );
            if (!res.ok) return null;
            const data = await res.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
            return null;
        } catch {
            return null;
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

    React.useEffect(() => {
        const loadResolvedRecommendations = async () => {
            if (recommendedDishes.length > 0) {
                const resolved = await resolveScannedItems(recommendedDishes as ScannedItem[]) as Dish[];
                setResolvedRecommendedDishes(resolved);
            } else {
                setResolvedRecommendedDishes([]);
            }
        };
        loadResolvedRecommendations();
    }, [recommendedDishes]);

    const searchableDishes = useMemo(() => {
        const seen = new Set<string>();
        const pool: Dish[] = [];

        const addDish = (dish: Dish) => {
            const key = `${(dish.name || '').toLowerCase()}__${(dish.place || '').toLowerCase()}`;
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

    React.useEffect(() => {
        const resolveSearchableDishes = async () => {
            if (searchableDishes.length > 0) {
                const resolved = await resolveScannedItems(searchableDishes as ScannedItem[]) as Dish[];
                setResolvedSearchableDishes(resolved);
            } else {
                setResolvedSearchableDishes([]);
            }
        };
        resolveSearchableDishes();
    }, [allDishes, favoriteItems, historyItems]);

    const filteredDishes = useMemo(() => {
        const baseList = debouncedSearch.trim()
            ? searchDishes(resolvedSearchableDishes, debouncedSearch)
            : resolvedRecommendedDishes;

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
            (cuisineValue && activeFilters.cuisine.some(c => {
                const cv = cuisineValue.toLowerCase();
                if (c.toLowerCase() === 'nepali') {
                    return cv.includes('nepal') || cv.includes('nepali') || cv.includes('newari') || cv.includes('thakali');
                }
                return cv.includes(c.toLowerCase());
            }));
        
        const matchesPrepTime = activeFilters.prepTime.length === 0 || 
            (!dish.prepTime ? false : activeFilters.prepTime.some(pt => {
                const prepStr = String(dish.prepTime || '');
                const prepMins = parseInt(prepStr.split('-')[0].replace(/\D/g, '') || '0');
                if (pt === 'under15') return prepMins > 0 && prepMins < 15;
                if (pt === 'under30') return prepMins > 0 && prepMins < 30;
                return true;
            }));

        let matchesLocation = true;
        const KATHMANDU_CENTER = { lat: 27.7172, lng: 85.3240 };
        
        if (activeFilters.location === 'kathmandu') {
            const loc = (dish.location || '').toLowerCase();
            matchesLocation = !!dish.location && (loc.includes('kathmandu') || loc.includes('ktm'));
        } else if (activeFilters.location === 'nearby') {
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
        } else if (activeFilters.location === 'within2km') {
            if (dish.latitude != null && dish.longitude != null) {
                const R = 6371;
                const dLat = (dish.latitude - KATHMANDU_CENTER.lat) * Math.PI / 180;
                const dLng = (dish.longitude - KATHMANDU_CENTER.lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(KATHMANDU_CENTER.lat * Math.PI / 180) * Math.cos(dish.latitude * Math.PI / 180) *
                    Math.sin(dLng / 2) ** 2;
                const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                matchesLocation = dist <= 2;
            } else {
                const loc = (dish.location || '').toLowerCase();
                matchesLocation = loc.includes('kathmandu') || loc.includes('ktm');
            }
        }

        let matchesRating = true;
        if (activeFilters.rating) {
            const normalizedName = (dish.name || '').toLowerCase().trim();
            const ratingKey = `dish_${normalizedName}`;
            
            const localRating = dishRatings[ratingKey];
            const ratingKey2 = dish.datasetId || String(dish.id);
            const fetchedData = dishAverageRatings?.[ratingKey2];
            const avgRating = localRating?.rating || fetchedData?.averageRating || 0;
            
            if (activeFilters.rating === 'rated') {
                const hasRating = !!localRating || (fetchedData?.totalReviews || 0) > 0 || avgRating > 0;
                matchesRating = hasRating;
            } else {
                const minRating = parseFloat(activeFilters.rating);
                matchesRating = avgRating >= minRating;
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
            console.log('Rating sort - results count:', results.length);
            results = results.map(d => {
                const fetched = dishAverageRatings?.[String(d.id)];
                const allDish = allDishes.find(x => x.name === d.name);
                const rating = fetched?.averageRating || d.averageRating || allDish?.averageRating || 0;
                console.log('Dish:', d.name, 'rating:', rating, 'fetched:', fetched, 'allDish:', allDish?.averageRating);
                return { ...d, _sortRating: rating };
            }).sort((a, b) => {
                const ratingA = (a as any)._sortRating;
                const ratingB = (b as any)._sortRating;
                return ratingB - ratingA;
            });
            console.log('Rating sort - top 3:', results.slice(0, 3).map(d => ({ name: d.name, rating: (d as any)._sortRating })));
            results = results.map(d => {
                const { _sortRating, ...rest } = d as any;
                return rest as typeof d;
            });
        } else if (sortBy === 'prep-time') {
            results.sort((a, b) => {
                const parseTime = (t: string | number | undefined) => {
                    if (!t) return Infinity;
                    const str = String(t);
                    return parseInt(str.split('-')[0].replace(/\D/g, '') || '999');
                };
                const timeA = parseTime(a.prepTime);
                const timeB = parseTime(b.prepTime);
                return timeA - timeB;
            });
        }

        return results;
    }, [resolvedRecommendedDishes, searchableDishes, debouncedSearch, activeFilters, dishAverageRatings, dishRatings, allDishes, sortBy]);

    const groupedDishes = useMemo(() => {
        if (!debouncedSearch.trim() && filteredDishes.length === 0) return [];
        const dishesToGroup = debouncedSearch.trim() ? filteredDishes : searchableDishes;
        
        if (debouncedSearch.trim()) {
            const places = new Set(dishesToGroup.map(d => d.place?.toLowerCase().trim()).filter(Boolean));
            const hasMultipleDishesFromSamePlace = dishesToGroup.length > 1 && places.size < dishesToGroup.length;
            
            if (hasMultipleDishesFromSamePlace) {
                return groupDishesByRestaurant(dishesToGroup as Dish[]);
            }
        }
        
        return groupDishesByName(dishesToGroup as Dish[]);
    }, [filteredDishes, searchableDishes, debouncedSearch]);

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
            // 0. Geocode manually entered location if needed
            let locationLat = userLocation?.lat;
            let locationLng = userLocation?.lng;
            
            if (restaurantLocation && restaurantLocation.trim().length > 0) {
                const coords = await geocodeAddress(restaurantLocation);
                if (coords) {
                    locationLat = coords.lat;
                    locationLng = coords.lng;
                    setUserLocation({ lat: coords.lat, lng: coords.lng, city: '' });
                }
            }

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

            // Process items with dataset lookup
            const processedItems: ScannedItem[] = [];
            
            for (const item of (data.menuItems || [])) {
                console.log(`[Dataset] Processing dish: "${item.name}"`);
                
                // 1. Check dataset first
                let datasetItem = await checkDishInDataset(item.name);
                
                let datasetId: string;
                if (datasetItem) {
                    // Exists - use reference, increment count
                    datasetId = datasetItem.id!;
                    console.log(`[Dataset] Found in dataset: ${datasetId}, incrementing scanCount`);
                    await incrementScanCount(datasetId);
                } else {
                    // New - add to dataset with image and all data
                    console.log(`[Dataset] Adding new dish to dataset: "${item.name}"`);
                    datasetId = await addDishToDataset({
                        name: item.name,
                        description: item.description,
                        ingredients: Array.isArray(item.ingredients) ? item.ingredients : item.ingredients ? [item.ingredients] : undefined,
                        allergens: item.allergens,
                        calories: item.calories ? `${item.calories} kcal` : undefined,
                        prepTime: item.prepTime || item.preparationTime || item.cookingTime,
                        imageUrl: item.imageUrl,
                        isVegan: item.isVegan,
                        isVegetarian: item.isVegetarian,
                        isGlutenFree: item.isGlutenFree,
                        origin: item.origin,
                        category: item.category,
                        latitude: locationLat,
                        longitude: locationLng,
                        nutrition: item.nutrition
                    }) || '';
                    console.log(`[Dataset] Added to dataset with ID: ${datasetId}`);
                }
                
                // 2. Store minimal data: datasetId + name + price (no image duplication)
                processedItems.push({
                    datasetId,
                    name: item.name,
                    price: item.price || 'Price not available',
                    place: restaurantName || 'Scanned Menu',
                    location: restaurantLocation || '',
                    latitude: locationLat,
                    longitude: locationLng,
                    nutrition: item.nutrition
                });
            }
            
            const items = processedItems;
            const extractedText = data.fullText || "";

            if (items.length > 0) {
                const sanitizedItems = items.map((item: ScannedItem) => 
                    Object.fromEntries(
                        Object.entries(item).filter(([_, v]) => v !== undefined)
                    )
                ) as ScannedItem[];
                
                const now = new Date();
                    const sortDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    
                    const newHistoryItem: HistoryItem = {
                    id: Date.now(),
                    place: restaurantName || 'Scanned Menu',
                    location: restaurantLocation || '',
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    sortDate: sortDateStr,
                    items: items.slice(0, 2).map(i => i.name).join(', ') + (items.length > 2 ? '...' : ''),
                    total: `${items.length} dishes found`,
                    scannedItems: sanitizedItems
                };

                setHistoryItems(prev => [newHistoryItem, ...prev]);

                // Persist to Firestore
                if (auth.currentUser) {
                    const userDocRef = doc(db, 'users', auth.currentUser.uid);
                    
                    // Increment restaurant scan count
                    if (restaurantName) {
                        const restaurantId = `${restaurantName}_${restaurantLocation || ''}`;
                        await incrementRestaurantScanCount(restaurantId);
                    }
                    
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
            
            // Extract dish name from AI response
            const dishName = data.data?.name || trimmed;
            console.log(`[Chat] Processing dish: "${dishName}"`);
            
            let finalImageUrl: string | null = null;
            
            // Check dataset for the dish
            let datasetItem = await checkDishInDataset(dishName);
            
            if (datasetItem) {
                // Exists - use dataset, increment scan count
                console.log(`[Chat] Found in dataset: ${datasetItem.id}`);
                await incrementScanCount(datasetItem.id!);
                finalImageUrl = datasetItem.imageUrl || null;
            } else {
                // New - add to dataset with GPT-generated image
                console.log(`[Chat] Adding new dish to dataset: "${dishName}"`);
const newDishId = await addDishToDataset({
                    name: dishName,
                    description: data.data?.description,
                    ingredients: Array.isArray(data.data?.ingredients) ? data.data.ingredients : data.data?.ingredients ? [data.data?.ingredients] : undefined,
                    allergens: data.data?.allergens,
                    calories: data.data?.calories ? `${data.data.calories} kcal` : undefined,
                    prepTime: data.data?.preparationTime,
                    imageUrl: data.imageUrl || undefined,
                    isVegan: data.data?.isVegan,
                    isVegetarian: data.data?.isVegetarian,
                    isGlutenFree: data.data?.isGlutenFree,
                    origin: data.data?.origin,
                    category: data.data?.category,
                    nutrition: data.data?.nutrition
                });
                console.log(`[Chat] Added to dataset with ID: ${newDishId}`);
                
                // Get the full data from dataset to get the properly stored image
                if (newDishId) {
                    const newDatasetItem = await getDishById(newDishId);
                    finalImageUrl = newDatasetItem?.imageUrl || null;
                }
            }
            
            const replyText = data.success && data.data
                ? Object.entries(data.data)
                    .map(([k, v]) => {
                        if (k === 'nutrition' && typeof v === 'object' && v !== null) {
                            const n = v as any;
                            return `**nutrition**: Protein: ${n.protein ?? 0}g, Carbs: ${n.carbohydrates ?? 0}g, Fat: ${n.fat ?? 0}g, Fiber: ${n.fiber ?? 0}g, Sodium: ${n.sodium ?? 0}mg`;
                        }
                        return `**${k}**: ${Array.isArray(v) ? (v as string[]).join(', ') : v ?? 'N/A'}`;
                    })
                    .join('\n')
                : (data.error || 'Sorry, I could not get a response.');
            const botMsg: ChatMessage = {
                id: Date.now() + 1,
                text: replyText,
                sender: 'bot',
                imageUrl: finalImageUrl,
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
            <div className="relative w-full h-full flex flex-col shadow-2xl bg-gray-50 overflow-hidden touch-pan-y">
                {dishesLoading && (
                    <div className="absolute inset-0 bg-white/80 z-[200] flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 font-medium">Loading dishes...</p>
                        </div>
                    </div>
                )}
                <main ref={containerRef} className="flex-1 overflow-y-auto z-[3] relative overscroll-contain custom-scrollbar">
                    {activeTab === 'home' && (
                        <HomeTab
                            searchText={searchText}
                            setSearchText={setSearchText}
                            setShowScanOptions={setShowScanOptions}
                            filteredDishes={filteredDishes}
                            groupedDishes={groupedDishes}
                            favoriteItems={favoriteItems}
                            toggleRecommendedLike={toggleRecommendedLike}
                            onSelectDish={(dish) => setSelectedDish(dish as ScannedItem)}
                            onAddToMealLog={(dish) => {
                                if (!isDishInMealLog(dish?.name || '')) {
                                    addToLog(dish as ScannedItem, selectedMealType);
                                    showToast(`${dish?.name || 'Dish'} added to ${selectedMealType}!`, 'success');
                                } else {
                                    showToast(`${dish?.name || 'Dish'} is already in your meal log`, 'info');
                                }
                            }}
                            isDishInMealLog={isDishInMealLog}
                            dishRatings={dishRatings}
                            dishAverageRatings={dishAverageRatings}
                            dishPopularity={popularityMap}
                            userAllergens={foodProfile.allergens}
                            activeFilters={activeFilters}
                            setActiveFilters={setActiveFilters}
                            locationLoading={locationLoading}
                            allDishes={resolvedSearchableDishes}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            onLocationClick={(dish) => setSelectedLocationDish(dish as Dish)}
                            onNavigateToMealLog={() => setActiveTab('meallog')}
                            mealLogEntries={todayLog?.entries || []}
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
                            onLocationClick={(dish) => setSelectedLocationDish(dish as Dish)}
                            userAllergens={foodProfile.allergens}
                            onAddToMealLog={(item) => {
                                if (!isDishInMealLog(item?.name || '')) {
                                    addToLog(item, selectedMealType);
                                    showToast(`${item?.name || 'Dish'} added to ${selectedMealType}!`, 'success');
                                } else {
                                    showToast(`${item?.name || 'Dish'} is already in your meal log`, 'info');
                                }
                            }}
                            isDishInMealLog={isDishInMealLog}
                            restaurantPlace={selectedHistoryRestaurant?.place}
                            restaurantLocation={selectedHistoryRestaurant?.location}
                            onRateRestaurant={(place, location) => {
                                setSelectedRestaurantForRating({ place, location });
                                setShowRestaurantRatingModal(true);
                            }}
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
                            onSelectHistoryItem={async (item) => {
                                if (item.scannedItems && item.scannedItems.length > 0) {
                                    const resolved = await resolveScannedItems(item.scannedItems);
                                    setScannedItems(resolved);
                                    setActiveTab('results');
                                    setViewMode('items');
                                    setFullText("");
                                    setSelectedHistoryRestaurant({ place: item.place, location: item.location || '' });
                                } else {
                                    alert("No detailed items found for this scan.");
                                }
                            }}
                            onSelectFavorite={(dish) => setSelectedDish(dish as ScannedItem)}
                            dishRatings={dishRatings}
                        />
                    )}
                    {activeTab === 'meallog' && (
                        <MealLogTab 
                            onSelectDish={(dish) => setSelectedDish(dish as ScannedItem)} 
                            onShowToast={showToast}
                            selectedMealType={selectedMealType}
                            onMealTypeChange={setSelectedMealType}
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
                    <DialogContent showCloseButton={false} className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-h-[90vh]">
                        <div className="h-32 bg-amber-400 relative shrink-0">
                            {selectedDish?.imageUrl ? (
                                <img 
                                    src={selectedDish.imageUrl} 
                                    alt={selectedDish.name} 
                                    className="w-full h-full object-cover cursor-zoom-in"
                                    onClick={() => setPreviewImage({ url: selectedDish.imageUrl, alt: selectedDish.name })}
                                />
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
                                <div className="mb-4">
                                    <div className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                                        <MapPin size={14} /> {selectedDish.place}{selectedDish.location ? `, ${selectedDish.location}` : ''}
                                        {selectedDish?.latitude && selectedDish?.longitude && (
                                            <button
                                                onClick={() => setSelectedLocationDish(selectedDish as Dish)}
                                                className="ml-1 text-xs text-amber-500 hover:text-amber-600"
                                            >
                                                (View Map)
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (selectedDish?.place) {
                                                const restaurantId = `${selectedDish.place}_${selectedDish.location || ''}`;
                                                setSelectedRestaurantForRating({ place: selectedDish.place, location: selectedDish.location || '' });
                                                setShowRestaurantReviewsModal(true);
                                            }
                                        }}
                                        className="text-sm text-amber-600 hover:text-amber-700 font-medium underline"
                                    >
                                        About Restaurant
                                    </button>
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Ingredients</Label>
                                    {Array.isArray(selectedDish?.ingredients) && selectedDish.ingredients.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedDish.ingredients.map((ingredient, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                    {ingredient}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-700 leading-relaxed mt-1">No ingredients listed</p>
                                    )}
                                </div>
                                {(selectedDish?.nutrition) && (
                                    <>
                                        <Separator />
                                        <div>
                                            <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Nutrition</Label>
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                {selectedDish?.nutrition?.protein !== undefined && selectedDish?.nutrition?.protein !== null && (
                                                    <div className="bg-purple-50 px-3 py-2 rounded-lg">
                                                        <p className="text-xs text-purple-600 font-medium">Protein</p>
                                                        <p className="text-gray-900 font-bold">{selectedDish.nutrition.protein}g</p>
                                                    </div>
                                                )}
                                                {selectedDish?.nutrition?.carbohydrates !== undefined && selectedDish?.nutrition?.carbohydrates !== null && (
                                                    <div className="bg-blue-50 px-3 py-2 rounded-lg">
                                                        <p className="text-xs text-blue-600 font-medium">Carbs</p>
                                                        <p className="text-gray-900 font-bold">{selectedDish.nutrition.carbohydrates}g</p>
                                                    </div>
                                                )}
                                                {selectedDish?.nutrition?.fat !== undefined && selectedDish?.nutrition?.fat !== null && (
                                                    <div className="bg-yellow-50 px-3 py-2 rounded-lg">
                                                        <p className="text-xs text-yellow-700 font-medium">Fat</p>
                                                        <p className="text-gray-900 font-bold">{selectedDish.nutrition.fat}g</p>
                                                    </div>
                                                )}
                                                {selectedDish?.nutrition?.fiber !== undefined && selectedDish?.nutrition?.fiber !== null && (
                                                    <div className="bg-green-50 px-3 py-2 rounded-lg">
                                                        <p className="text-xs text-green-600 font-medium">Fiber</p>
                                                        <p className="text-gray-900 font-bold">{selectedDish.nutrition.fiber}g</p>
                                                    </div>
                                                )}
                                                {selectedDish?.nutrition?.sodium !== undefined && selectedDish?.nutrition?.sodium !== null && (
                                                    <div className="bg-red-50 px-3 py-2 rounded-lg">
                                                        <p className="text-xs text-red-600 font-medium">Sodium</p>
                                                        <p className="text-gray-900 font-bold">{selectedDish.nutrition.sodium}mg</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Calories</Label>
                                        <p className="text-gray-900 font-bold mt-1 text-lg">{selectedDish?.calories || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Prep Time</Label>
                                        <p className="text-gray-900 font-bold mt-1 text-lg">{formatPrepTime(selectedDish?.prepTime) || 'N/A'}</p>
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
                                                <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
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
                                                            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
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

                <Dialog open={!!selectedLocationDish} onOpenChange={(open) => !open && setSelectedLocationDish(null)}>
                    <DialogContent className="sm:max-w-lg rounded-3xl p-4 border-none">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                {selectedLocationDish?.place || 'Restaurant Location'}
                            </DialogTitle>
                            <DialogDescription>
                                Location for {selectedLocationDish?.name}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedLocationDish?.latitude != null && selectedLocationDish?.longitude != null ? (
                            <LocationMap
                                latitude={selectedLocationDish.latitude}
                                longitude={selectedLocationDish.longitude}
                                placeName={selectedLocationDish.place}
                            />
                        ) : (
                            <div className="w-full h-[300px] rounded-xl bg-gray-100 flex items-center justify-center">
                                <p className="text-gray-500">No location data available</p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button onClick={() => setSelectedLocationDish(null)} className="w-full">
                                Close
                            </Button>
                        </DialogFooter>
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

                <Dialog open={showRestaurantRatingModal} onOpenChange={setShowRestaurantRatingModal}>
                    <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Rate Restaurant Experience</DialogTitle>
                            <DialogDescription>
                                How was your experience at {selectedRestaurantForRating?.place}?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Your Rating</Label>
                            <div className="flex items-center gap-1">
                                <StarRating 
                                    rating={restaurantRating} 
                                    readonly={false} 
                                    size={32}
                                    onRatingChange={(rating) => setRestaurantRating(Math.round(rating))}
                                />
                            </div>
                            {restaurantRating > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {restaurantRating === 1 && "Poor"}
                                    {restaurantRating === 2 && "Fair"}
                                    {restaurantRating === 3 && "Good"}
                                    {restaurantRating === 4 && "Very Good"}
                                    {restaurantRating === 5 && "Excellent"}
                                </p>
                            )}
                        </div>

                        <div className="py-2">
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">Comment (optional)</Label>
                            <Input
                                placeholder="Share your experience..."
                                value={restaurantComment}
                                onChange={(e) => setRestaurantComment(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        <DialogFooter className="flex sm:flex-row gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowRestaurantRatingModal(false);
                                    setRestaurantRating(0);
                                    setRestaurantComment('');
                                    setSelectedRestaurantForRating(null);
                                }} 
                                disabled={isSavingRestaurantReview} 
                                className="flex-1 h-12 rounded-xl border-gray-200 font-bold"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={saveRestaurantReview}
                                disabled={restaurantRating === 0 || isSavingRestaurantReview}
                                className="flex-1 h-12 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold"
                            >
                                {isSavingRestaurantReview ? 'Saving...' : 'Submit'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showRestaurantReviewsModal} onOpenChange={setShowRestaurantReviewsModal}>
                    <DialogContent className="sm:max-w-lg rounded-3xl p-6 border-none max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">{selectedDish?.place}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                {restaurantTotalReviews > 0 ? (
                                    <>
                                        <StarRating rating={restaurantAvgRating} readonly size={16} />
                                        <span className="font-medium text-gray-700">{restaurantAvgRating.toFixed(1)} ({restaurantTotalReviews} reviews)</span>
                                    </>
                                ) : (
                                    <span>No reviews yet</span>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            {restaurantReviewsLoading ? (
                                <div className="text-center py-4 text-gray-400">Loading reviews...</div>
                            ) : restaurantReviews.length > 0 ? (
                                restaurantReviews.map((review) => (
                                    <div key={review.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">{review.userName}</span>
                                            <StarRating rating={review.rating} readonly size={14} />
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-gray-600">{review.comment}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">{formatDate(review.createdAt)}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <p>No reviews yet.</p>
                                    <p className="text-sm mt-2">Be the first to rate this restaurant!</p>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={() => {
                                setShowRestaurantReviewsModal(false);
                                setSelectedRestaurantForRating({ place: selectedDish!.place, location: selectedDish!.location || '' });
                                setShowRestaurantRatingModal(true);
                            }}
                            className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold"
                        >
                            Rate This Restaurant
                        </Button>

                        <Button 
                            variant="outline" 
                            onClick={() => setShowRestaurantReviewsModal(false)}
                            className="w-full h-12 rounded-xl border-gray-200 font-bold"
                        >
                            Close
                        </Button>
                    </DialogContent>
                </Dialog>

                <ToastContainer toasts={toasts} onRemove={removeToast} />

                <ImagePreviewModal
                    isOpen={!!previewImage}
                    onClose={() => setPreviewImage(null)}
                    imageUrl={previewImage?.url || ''}
                    alt={previewImage?.alt || ''}
                />
            </div>
        </div>
    );
}

export default Dashboard;
