export interface UserBodyMetrics {
    age?: number;
    weightKg?: number;
    heightCm?: number;
    gender?: 'male' | 'female' | 'other';
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export const ACTIVITY_LEVELS: { value: UserBodyMetrics['activityLevel']; label: string }[] = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'light', label: 'Lightly active (1–3 days/week)' },
    { value: 'moderate', label: 'Moderately active (3–5 days/week)' },
    { value: 'active', label: 'Active (6–7 days/week)' },
    { value: 'very_active', label: 'Very active (intense daily exercise)' },
];

export interface MacroGoals {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
    sodiumMg: number;
}

export interface NutritionGoals {
    dailyCalories: number;
    macros: MacroGoals;
}

export const DEFAULT_MACRO_GOALS: MacroGoals = {
    proteinGrams: 150,
    carbsGrams: 250,
    fatGrams: 65,
    fiberGrams: 30,
    sodiumMg: 2300,
};

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
    dailyCalories: 2000,
    macros: { ...DEFAULT_MACRO_GOALS },
};

export const DEFAULT_BODY_METRICS: UserBodyMetrics = {
    age: undefined,
    weightKg: undefined,
    heightCm: undefined,
    gender: undefined,
    activityLevel: undefined,
};

export interface MealLogNutritionSummary {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSodium: number;
    totalCost: number;
    mealCount: number;
}

export const NUTRITION_META: { key: keyof MacroGoals; label: string; unit: string; color: string }[] = [
    { key: 'proteinGrams', label: 'Protein', unit: 'g', color: 'bg-purple-500' },
    { key: 'carbsGrams', label: 'Carbs', unit: 'g', color: 'bg-blue-500' },
    { key: 'fatGrams', label: 'Fat', unit: 'g', color: 'bg-yellow-500' },
    { key: 'fiberGrams', label: 'Fiber', unit: 'g', color: 'bg-green-500' },
    { key: 'sodiumMg', label: 'Sodium', unit: 'mg', color: 'bg-red-400' },
];
