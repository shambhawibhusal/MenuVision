import { Dish, DishGroup } from '@/types/dashboard';

const RECENT_SEARCHES_KEY = 'menuvision_recent_searches';
const MAX_RECENT_SEARCHES = 8;

function parsePrice(priceStr: string | undefined): number {
    if (!priceStr) return 0;
    const match = String(priceStr).replace(/[^\d]/g, '');
    return parseInt(match) || 0;
}

export function groupDishesByName(dishes: Dish[]): DishGroup[] {
    const groups = new Map<string, Dish[]>();

    dishes.forEach(dish => {
        const nameKey = (dish.name || '').toLowerCase().trim();
        if (!nameKey) return;

        if (!groups.has(nameKey)) {
            groups.set(nameKey, []);
        }
        groups.get(nameKey)!.push(dish);
    });

    return Array.from(groups.entries()).map(([nameKey, restaurantDishes]) => {
        const sortedByRating = [...restaurantDishes].sort((a, b) => {
            const ratingA = a.averageRating || 0;
            const ratingB = b.averageRating || 0;
            return ratingB - ratingA;
        });

        const primaryDish = sortedByRating[0];

        const prices = restaurantDishes
            .map(d => parsePrice(d.price))
            .filter(p => p > 0)
            .sort((a, b) => a - b);

        const lowestPrice = prices.length > 0 ? prices[0] : 0;
        const highestPrice = prices.length > 0 ? prices[prices.length - 1] : 0;

        const formatPrice = (p: number) => p > 0 ? `Rs. ${p}` : '';

        return {
            name: primaryDish.name || nameKey,
            restaurants: restaurantDishes,
            primaryDish,
            restaurantCount: restaurantDishes.length,
            priceRange: lowestPrice > 0 && highestPrice > 0 && lowestPrice !== highestPrice
                ? `${formatPrice(lowestPrice)} - ${formatPrice(highestPrice)}`
                : formatPrice(lowestPrice),
            lowestPrice: formatPrice(lowestPrice),
            highestPrice: formatPrice(highestPrice),
        };
    }).sort((a, b) => {
        const ratingA = a.primaryDish.averageRating || 0;
        const ratingB = b.primaryDish.averageRating || 0;
        return ratingB - ratingA;
    });
}

export function searchDishes(dishes: Dish[], query: string): Dish[] {
    if (!query.trim()) return dishes;

    const terms = query.toLowerCase().trim().split(/\s+/);

    return dishes
        .map(dish => ({ dish, score: getRelevanceScore(dish, terms) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.dish);
}

function getRelevanceScore(dish: Dish, terms: string[]): number {
    let score = 0;

    const name = (dish.name || '').toLowerCase();
    const description = (dish.description || '').toLowerCase();
    const ingredients = (dish.ingredients || '').toString().toLowerCase();
    const place = (dish.place || '').toLowerCase();
    const cuisine = (dish.cuisine || dish.origin || '').toLowerCase();
    const category = (dish.category || '').toLowerCase();
    const tags = (dish.tags || []).map(t => t.toLowerCase()).join(' ');

    for (const term of terms) {
        if (place.includes(term)) {
            score += place.startsWith(term) ? 10 : 7;
        } else if (name.includes(term)) {
            score += name.startsWith(term) ? 9 : 5;
        } else if (cuisine.includes(term)) {
            score += 4;
        } else if (category.includes(term)) {
            score += 3;
        } else if (tags.includes(term)) {
            score += 3;
        } else if (ingredients.includes(term)) {
            score += 2;
        } else if (description.includes(term)) {
            score += 1;
        } else {
            return 0;
        }
    }

    return score;
}

export function getSuggestions(dishes: Dish[], query: string, limit = 5): Dish[] {
    if (!query.trim()) return [];
    const terms = query.toLowerCase().trim().split(/\s+/);
    return dishes
        .map(dish => ({ dish, score: getRelevanceScore(dish, terms) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.dish);
}

export function getRecentSearches(): string[] {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function addRecentSearch(query: string): void {
    if (!query.trim()) return;
    try {
        let searches = getRecentSearches();
        searches = [query, ...searches.filter(s => s.toLowerCase() !== query.toLowerCase())];
        searches = searches.slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch {
        // ignore storage errors
    }
}

export function clearRecentSearches(): void {
    try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
        // ignore
    }
}

export function groupDishesByRestaurant(dishes: Dish[]): DishGroup[] {
    const groups = new Map<string, Dish[]>();

    dishes.forEach(dish => {
        const placeKey = (dish.place || '').toLowerCase().trim();
        if (!placeKey) return;

        if (!groups.has(placeKey)) {
            groups.set(placeKey, []);
        }
        groups.get(placeKey)!.push(dish);
    });

    return Array.from(groups.entries()).map(([placeKey, restaurantDishes]) => {
        const sortedByRating = [...restaurantDishes].sort((a, b) => {
            const ratingA = a.averageRating || 0;
            const ratingB = b.averageRating || 0;
            return ratingB - ratingA;
        });

        const primaryDish = sortedByRating[0];

        const prices = restaurantDishes
            .map(d => parsePrice(d.price))
            .filter(p => p > 0)
            .sort((a, b) => a - b);

        const lowestPrice = prices.length > 0 ? prices[0] : 0;
        const highestPrice = prices.length > 0 ? prices[prices.length - 1] : 0;

        const formatPrice = (p: number) => p > 0 ? `Rs. ${p}` : '';

        return {
            name: primaryDish.place || placeKey,
            restaurants: restaurantDishes,
            primaryDish,
            restaurantCount: restaurantDishes.length,
            priceRange: lowestPrice > 0 && highestPrice > 0 && lowestPrice !== highestPrice
                ? `${formatPrice(lowestPrice)} - ${formatPrice(highestPrice)}`
                : formatPrice(lowestPrice),
            lowestPrice: formatPrice(lowestPrice),
            highestPrice: formatPrice(highestPrice),
        };
    }).sort((a, b) => {
        const ratingA = a.primaryDish.averageRating || 0;
        const ratingB = b.primaryDish.averageRating || 0;
        return ratingB - ratingA;
    });
}
