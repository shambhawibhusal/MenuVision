export interface ScannedItem {
    datasetId?: string;
    name: string;
    price: string;
    place?: string;
    location?: string;
    calories?: string;
    ingredients?: string | string[];
    description?: string;
    imageUrl?: string | null;
    allergens?: string[];
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    prepTime?: string;
    origin?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    nutrition?: Nutrition;
}

export interface Nutrition {
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    [key: string]: number | undefined;
}

export interface MenuDatasetItem {
    id?: string;
    name: string;
    nameLower?: string;
    description?: string;
    ingredients?: string[];
    allergens?: string[];
    calories?: string;
    prepTime?: string;
    imageUrl?: string | null;
    isVegan?: boolean;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    origin?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    createdAt?: Date;
    updatedAt?: Date;
    scanCount: number;
    nutrition?: Nutrition;
}

export interface DishRating {
    userId: string;
    userName?: string;
    rating: number;
    comment?: string;
    createdAt: string | any;
}

export interface DishReview extends DishRating {
    id: string;
    dishId: string;
}

export interface NewReview {
    dishId: string;
    userId: string;
    userName?: string;
    rating: number;
    comment?: string;
}

export interface Dish extends ScannedItem {
    id: number;
    datasetId?: string;
    place: string;
    cuisine?: string;
    tags?: string[];
    priceRange?: 'budget' | 'moderate' | 'expensive' | 'premium';
    ratings?: DishRating[];
    averageRating?: number;
    latitude?: number;
    longitude?: number;
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

export type Tab = 'home' | 'results' | 'chat' | 'profile' | 'history' | 'meallog';

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

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLogEntry {
    id: string;
    dishId: string;
    dishName: string;
    dishDatasetId?: string;
    price: string;
    place?: string;
    calories?: string;
    imageUrl?: string | null;
    mealType: MealType;
    date: string;
    addedAt: string;
}

export interface DailyMealLog {
    date: string;
    entries: MealLogEntry[];
    totalCalories?: number;
    totalCost?: number;
}
