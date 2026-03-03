import { Dish } from '@/types/dashboard';

export interface RecommendationScore {
    dish: Dish;
    score: number;
}

function extractPriceValue(price: string): number {
    const match = price.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function getPriceRange(price: string): 'budget' | 'moderate' | 'expensive' {
    const value = extractPriceValue(price);
    if (value <= 300) return 'budget';
    if (value <= 700) return 'moderate';
    return 'expensive';
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
        const ingredients = typeof dish.ingredients === 'string' 
            ? dish.ingredients.toLowerCase().split(/,\s*/)
            : [];
        ingredients.forEach((ing: string) => {
            if (ing.length > 2) tags.add(ing.trim());
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
    globallyLikedDishes?: Dish[]
): Dish[] {
    const likedIds = new Set(likedDishes.map(d => d.id));
    const excludedIds = new Set([...unlikedDishIds]);

    const result: Dish[] = [];

    // 1. Add user's own liked dishes first
    likedDishes.forEach(liked => {
        if (!excludedIds.has(liked.id)) {
            result.push(liked);
        }
    });

    const seenIds = new Set<number>(result.map(d => d.id));

    // 2. Add ALL globally liked dishes (sorted by similarity to user's likes)
    if (globallyLikedDishes && globallyLikedDishes.length > 0) {
        const scoredGlobalDishes: RecommendationScore[] = [];

        globallyLikedDishes.forEach(dish => {
            // Skip if already in result or excluded
            if (seenIds.has(dish.id) || excludedIds.has(dish.id)) return;

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

        // Add ALL globally liked dishes to result
        scoredGlobalDishes.forEach(({ dish }) => {
            result.push(dish);
            seenIds.add(dish.id);
        });
    }

    // 3. Fallback: if no globally liked dishes, fill with random dishes
    if (result.length < maxRecommendations && (!globallyLikedDishes || globallyLikedDishes.length === 0)) {
        const candidateDishes = dishes.filter(d => !unlikedDishIds.includes(d.id));
        const shuffled = [...candidateDishes].sort(() => Math.random() - 0.5);
        shuffled.forEach(dish => {
            if (!seenIds.has(dish.id) && result.length < maxRecommendations) {
                result.push(dish);
                seenIds.add(dish.id);
            }
        });
    }

    // Return all results (no limit)
    return result;
}

export function getDishById(dishes: Dish[], id: number): Dish | undefined {
    return dishes.find(d => d.id === id);
}

export { normalizeTags };
