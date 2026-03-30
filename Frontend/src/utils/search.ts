import { Dish } from '@/types/dashboard';

const RECENT_SEARCHES_KEY = 'menuvision_recent_searches';
const MAX_RECENT_SEARCHES = 8;

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
        if (name.includes(term)) {
            score += name.startsWith(term) ? 10 : 6;
        } else if (cuisine.includes(term)) {
            score += 4;
        } else if (place.includes(term)) {
            score += 3;
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
