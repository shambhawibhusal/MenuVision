import { ScannedItem } from '@/types/dashboard';

export interface AllergyCheckResult {
    isSafe: boolean;
    containsAllergens: string[];
    matchingAllergens: string[];
}

export const checkAllergens = (
    dish: ScannedItem,
    userAllergens: string[]
): AllergyCheckResult => {
    if (!userAllergens || userAllergens.length === 0) {
        return { isSafe: true, containsAllergens: [], matchingAllergens: [] };
    }

    const dishAllergens = dish.allergens || [];
    const matchingAllergens = userAllergens.filter(userAllergen =>
        dishAllergens.some(dishAllergen =>
            (dishAllergen || '').toLowerCase() === (userAllergen || '').toLowerCase()
        )
    );

    return {
        isSafe: matchingAllergens.length === 0,
        containsAllergens: dishAllergens,
        matchingAllergens
    };
};

export const checkMultipleDishes = (
    dishes: ScannedItem[],
    userAllergens: string[]
): Record<string, AllergyCheckResult> => {
    const results: Record<string, AllergyCheckResult> = {};
    dishes.forEach(dish => {
        results[dish.name.toLowerCase()] = checkAllergens(dish, userAllergens);
    });
    return results;
};

export const getSafeDishes = (
    dishes: ScannedItem[],
    userAllergens: string[]
): ScannedItem[] => {
    return dishes.filter(dish => checkAllergens(dish, userAllergens).isSafe);
};

export const getRiskyDishes = (
    dishes: ScannedItem[],
    userAllergens: string[]
): ScannedItem[] => {
    return dishes.filter(dish => !checkAllergens(dish, userAllergens).isSafe);
};

export const getHealthierAlternatives = (
    currentDish: ScannedItem,
    allDishes: ScannedItem[],
    userAllergens: string[] = []
): ScannedItem[] => {
    const alternatives: ScannedItem[] = [];
    const currentName = (currentDish?.name || '').toLowerCase();

    allDishes.forEach(dish => {
        if ((dish.name || '').toLowerCase() === currentName) return;

        let score = 0;

        if (dish.isVegan && !currentDish.isVegan) score += 3;
        if (dish.isVegetarian && !currentDish.isVegetarian) score += 2;
        if (dish.isGlutenFree && !currentDish.isGlutenFree) score += 1;

        if (currentDish.calories && dish.calories) {
            const currentCal = parseInt(currentDish.calories.match(/\d+/)?.[0] || '0');
            const dishCal = parseInt(dish.calories.match(/\d+/)?.[0] || '0');
            if (dishCal < currentCal) score += 2;
        }

        if (userAllergens.length > 0) {
            const currentCheck = checkAllergens(currentDish, userAllergens);
            const dishCheck = checkAllergens(dish, userAllergens);
            if (currentCheck.isSafe && !dishCheck.isSafe) score -= 5;
            if (!currentCheck.isSafe && dishCheck.isSafe) score += 5;
        }

        if (score > 0) {
            alternatives.push(dish);
        }
    });

    return alternatives.sort((a, b) => {
        let scoreA = 0, scoreB = 0;

        if (a.isVegan && !currentDish.isVegan) scoreA += 3;
        if (b.isVegan && !currentDish.isVegan) scoreB += 3;
        if (a.isVegetarian && !currentDish.isVegetarian) scoreA += 2;
        if (b.isVegetarian && !currentDish.isVegetarian) scoreB += 2;
        if (a.isGlutenFree && !currentDish.isGlutenFree) scoreA += 1;
        if (b.isGlutenFree && !currentDish.isGlutenFree) scoreB += 1;

        if (currentDish.calories && a.calories && b.calories) {
            const currentCal = parseInt(currentDish.calories.match(/\d+/)?.[0] || '0');
            const aCal = parseInt(a.calories.match(/\d+/)?.[0] || '0');
            const bCal = parseInt(b.calories.match(/\d+/)?.[0] || '0');
            if (aCal < currentCal) scoreA += 2;
            if (bCal < currentCal) scoreB += 2;
        }

        return scoreB - scoreA;
    }).slice(0, 5);
};

export const getAllergenIcon = (allergen: string): string => {
    const icons: Record<string, string> = {
        'dairy': '🥛',
        'eggs': '🥚',
        'fish': '🐟',
        'shellfish': '🦐',
        'tree nuts': '🌰',
        'peanuts': '🥜',
        'wheat': '🌾',
        'soy': '🫘',
        'sesame': '🌱',
        'sulfites': '🍷'
    };
    return icons[(allergen || '').toLowerCase()] || '⚠️';
};