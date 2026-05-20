import { Dish, FoodProfile } from '@/types/dashboard';

export interface RecommendationScore {
    dish: Dish;
    score: number;
}

function matchesFoodProfile(dish: Dish, foodProfile: FoodProfile): boolean {
    console.log('Checking dish:', dish.name, 'against foodProfile:', foodProfile);
    // Hard filter: if user is vegetarian, only recommend vegetarian dishes
    if (foodProfile.isVegetarian && !dish.isVegetarian) {
        console.log('Dish filtered out: not vegetarian, user is vegetarian');
        return false;
    }

    // Hard filter: if user is vegan, only recommend vegan dishes
    if (foodProfile.isVegan && !dish.isVegan) {
        return false;
    }

    // Hard filter: if user is gluten-free, only recommend gluten-free dishes
    if (foodProfile.isGlutenFree && !dish.isGlutenFree) {
        return false;
    }

    // Hard filter: exclude dishes containing user's allergens
    if (foodProfile.allergens && foodProfile.allergens.length > 0) {
        const dishAllergens = dish.allergens || [];
        const hasAllergen = foodProfile.allergens.some(userAllergen =>
            dishAllergens.some(dishAllergen =>
                dishAllergen.toLowerCase() === userAllergen.toLowerCase()
            )
        );
        if (hasAllergen) {
            return false;
        }
    }

    return true;
}

const EXCHANGE_RATES: Record<string, number> = {
    '$': 133,
    '€': 145,
    '£': 170,
    '¥': 0.89,
    'A$': 87,
    'C$': 98,
    'S$': 100,
    '฿': 3.9,
    '₩': 0.095,
    '₹': 1.6,
};

function detectCurrencySymbol(price: string): string {
    const trimmed = price.trim();
    if (/^£/.test(trimmed)) return '£';
    if (/^€/.test(trimmed)) return '€';
    if (/^¥/.test(trimmed)) return '¥';
    if (/^A\$/.test(trimmed)) return 'A$';
    if (/^C\$/.test(trimmed)) return 'C$';
    if (/^S\$/.test(trimmed)) return 'S$';
    if (/^฿/.test(trimmed)) return '฿';
    if (/^₩/.test(trimmed)) return '₩';
    if (/^₹/.test(trimmed)) return '₹';
    if (/^\$/.test(trimmed)) return '$';
    return '';
}

function extractNumericValue(price: string): number {
    const match = price.replace(/[^0-9.]/g, '').match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
}

export function normalizePrice(price: string): string {
    if (!price || price === 'Price not available' || price === 'N/A') return price;

    const symbol = detectCurrencySymbol(price);
    if (!symbol) return price;

    const numericValue = extractNumericValue(price);
    const rate = EXCHANGE_RATES[symbol];
    if (!rate || numericValue === 0) return `Rs. ${numericValue}`;

    const nprValue = Math.round(numericValue * rate);
    return `Rs. ${nprValue}`;
}

export function extractPriceValue(price: string): number {
    const match = price.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

export function getPriceRange(price: string): 'budget' | 'moderate' | 'expensive' | 'premium' {
    const value = extractPriceValue(price);
    if (value < 150) return 'budget';
    if (value <= 300) return 'moderate';
    if (value <= 500) return 'expensive';
    return 'premium';
}

export function formatPriceRange(priceMin?: string, priceMax?: string, fallbackPrice?: string): string {
    if (priceMin && priceMax) return `${priceMin} - ${priceMax}`;
    if (fallbackPrice) {
        const value = extractPriceValue(fallbackPrice);
        if (value > 0) {
            const min = Math.round(value * 0.8);
            const max = Math.round(value * 1.2);
            return `Rs. ${min} - Rs. ${max}`;
        }
    }
    return `Rs. 150 - Rs. 450`;
}

function normalizeTags(dish: Dish): string[] {
    const tags = new Set<string>();
    
    if (dish.tags) {
        dish.tags.forEach(t => tags.add(t.toLowerCase()));
    }
    if (dish.category) {
        tags.add(dish.category.toLowerCase());
    }
    if (dish.cuisine) {
        tags.add(dish.cuisine.toLowerCase());
    }
    const priceRange = dish.priceRange || getPriceRange(dish.price);
    tags.add(priceRange);
    
    if (dish.name) {
        const words = dish.name.toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (word.length > 2) tags.add(word);
        });
    }
    
    if (dish.ingredients) {
        const ingredients = Array.isArray(dish.ingredients)
            ? dish.ingredients
            : dish.ingredients.toLowerCase().split(/,\s*/);
        ingredients.forEach((ing: string) => {
            const trimmed = ing.trim().toLowerCase();
            if (trimmed.length > 2) tags.add(trimmed);
        });
    }
    
    return Array.from(tags);
}

export function calculateSimilarity(dish1: Dish, dish2: Dish): number {
    const tags1 = normalizeTags(dish1);
    const tags2 = normalizeTags(dish2);
    
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    
    let intersection = 0;
    set1.forEach(tag => {
        if (set2.has(tag)) intersection++;
    });
    
    const union = new Set([...tags1, ...tags2]).size;
    
    if (union === 0) return 0;
    
    const jaccardSimilarity = intersection / union;
    
    let bonus = 0;
    if (dish1.category && dish1.category === dish2.category) bonus += 0.15;
    if (dish1.cuisine && dish1.cuisine === dish2.cuisine) bonus += 0.15;
    if (dish1.priceRange && dish1.priceRange === dish2.priceRange) bonus += 0.05;
    
    return Math.min(jaccardSimilarity + bonus, 1);
}

export function getRecommendations(
    dishes: Dish[],
    likedDishes: Dish[],
    unlikedDishIds: number[],
    maxRecommendations: number = 10,
    globallyLikedDishes?: Dish[],
    foodProfile?: FoodProfile
): Dish[] {
    console.log('getRecommendations called:', {
        dishesCount: dishes.length,
        likedDishesCount: likedDishes.length,
        unlikedDishIdsCount: unlikedDishIds.length,
        globallyLikedDishesCount: globallyLikedDishes?.length,
        foodProfile
    });
    const excludedIds = new Set([...unlikedDishIds]);

    const result: Dish[] = [];

    // Helper to check if dish passes hard filters
    const passesFilters = (dish: Dish): boolean => {
        if (!foodProfile) return true;
        return matchesFoodProfile(dish, foodProfile);
    };

    // 1. Add user's own liked dishes first (if they match food profile)
    likedDishes.forEach(liked => {
        if (!excludedIds.has(liked.id) && passesFilters(liked)) {
            result.push(liked);
        }
    });

    const seenIds = new Set<number>(result.map(d => d.id));

    // 2. Add globally liked dishes that match food profile (sorted by similarity)
    if (globallyLikedDishes && globallyLikedDishes.length > 0) {
        const scoredGlobalDishes: RecommendationScore[] = [];

        globallyLikedDishes.forEach(dish => {
            // Skip if already in result, excluded, or doesn't match food profile
            if (seenIds.has(dish.id) || excludedIds.has(dish.id) || !passesFilters(dish)) return;

            // Calculate similarity score based on user's liked dishes
            let totalScore = 0;
            likedDishes.forEach(liked => {
                totalScore += calculateSimilarity(liked, dish);
            });

            // If user has no likes, give all globally liked dishes equal score
            const avgScore = likedDishes.length > 0 ? totalScore / likedDishes.length : 1;

            scoredGlobalDishes.push({ dish, score: avgScore });
        });

        // Sort by similarity score (highest first)
        scoredGlobalDishes.sort((a, b) => b.score - a.score);

        // Add all matching globally liked dishes to result
        scoredGlobalDishes.forEach(({ dish }) => {
            result.push(dish);
            seenIds.add(dish.id);
        });
    }

    // 3. Add dishes that match user's onboarding preferences (vegetarian, vegan, allergens)
    //    even if:
    //    - The dish has no likes
    //    - The dish has only been scanned by other users
    // This ensures onboarding preferences are always respected
    const hasUserLikes = likedDishes.length > 0;
    
    if (foodProfile) {
        const preferenceMatchingDishes: RecommendationScore[] = [];

        dishes.forEach(dish => {
            if (seenIds.has(dish.id) || excludedIds.has(dish.id)) return;
            
            if (matchesFoodProfile(dish, foodProfile)) {
                let score = 0.5;
                if (hasUserLikes) {
                    let totalScore = 0;
                    likedDishes.forEach(liked => {
                        totalScore += calculateSimilarity(liked, dish);
                    });
                    score = totalScore / likedDishes.length;
                } else {
                    score = 1.0;
                }
                
                preferenceMatchingDishes.push({ dish, score });
            }
        });

        preferenceMatchingDishes.sort((a, b) => b.score - a.score);

        preferenceMatchingDishes.forEach(({ dish }) => {
            result.push(dish);
            seenIds.add(dish.id);
        });
    } else if (!hasUserLikes) {
        dishes.forEach(dish => {
            if (seenIds.has(dish.id) || excludedIds.has(dish.id)) return;
            result.push(dish);
            seenIds.add(dish.id);
        });
    }

    // Return all results with explicit deduplication by ID and name
    const uniqueResult: Dish[] = [];
    const addedIds = new Set<number>();
    const addedNames = new Set<string>();
    result.forEach(dish => {
        if (!addedIds.has(dish.id) && !addedNames.has(dish.name.toLowerCase())) {
            addedIds.add(dish.id);
            addedNames.add(dish.name.toLowerCase());
            uniqueResult.push(dish);
        }
    });
    
    return uniqueResult.slice(0, maxRecommendations);
}

export function getDishById(dishes: Dish[], id: number): Dish | undefined {
    return dishes.find(d => d.id === id);
}

export { normalizeTags };
