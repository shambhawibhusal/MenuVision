export interface Dish {
    id: number;
    name: string;
    place: string;
    price: string;
    calories?: string;
    ingredients?: string;
    description?: string;
    category?: string;
    cuisine?: string;
    tags?: string[];
    priceRange?: 'budget' | 'moderate' | 'expensive';
    imageUrl?: string | null;
}

export interface ScannedItem {
    name: string;
    price: string;
    calories?: string;
    ingredients?: string;
    description?: string;
    imageUrl?: string | null;
}

export interface HistoryItem {
    id: number;
    place: string;
    location?: string;
    date: string;
    items: string;
    total: string;
    scannedItems?: ScannedItem[];
}

export interface ChatMessage {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    imageUrl?: string | null;
}

export type Tab = 'home' | 'results' | 'chat' | 'profile' | 'history';

export const ALLERGENS = [
    'Dairy',
    'Eggs',
    'Fish',
    'Shellfish',
    'Tree Nuts',
    'Peanuts',
    'Wheat',
    'Soy',
    'Sesame',
    'Sulfites'
] as const;

export type Allergen = typeof ALLERGENS[number];

export interface FoodProfile {
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    allergens: Allergen[];
    onboardingCompleted: boolean;
}

export const DEFAULT_FOOD_PROFILE: FoodProfile = {
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    allergens: [],
    onboardingCompleted: false
};
