import { Dish } from '@/types/dashboard';

export const DISH_DATABASE: Dish[] = [
    {
        id: 101,
        name: 'Spicy Ramen',
        place: 'Ichiraku Ramen',
        price: 'Rs. 450',
        category: 'mains',
        cuisine: 'Japanese',
        tags: ['spicy', 'noodles', 'soup', 'ramen', 'asian'],
        priceRange: 'moderate',
        calories: '550 kcal',
        description: 'Rich and flavorful spicy ramen with fresh noodles.'
    },
    {
        id: 102,
        name: 'Cheese Pizza',
        place: 'Pizza Hut',
        price: 'Rs. 800',
        category: 'mains',
        cuisine: 'Italian',
        tags: ['cheese', 'pizza', 'vegetarian', 'italian', 'baked'],
        priceRange: 'moderate',
        calories: '750 kcal',
        description: 'Classic cheese pizza with premium mozzarella.'
    },
    {
        id: 103,
        name: 'Chicken MoMo',
        place: 'Everest MoMo',
        price: 'Rs. 250',
        category: 'starters',
        cuisine: 'Nepali',
        tags: ['steamed', 'chicken', 'momo', 'asian', 'dumplings'],
        priceRange: 'budget',
        calories: '320 kcal',
        description: 'Traditional Nepali steamed dumplings with chicken filling.'
    },
    {
        id: 104,
        name: 'Beef Burger',
        place: 'Burger House',
        price: 'Rs. 550',
        category: 'mains',
        cuisine: 'American',
        tags: ['beef', 'burger', 'grilled', 'fast-food', 'american'],
        priceRange: 'moderate',
        calories: '680 kcal',
        description: 'Juicy beef burger with fresh vegetables.'
    },
    {
        id: 105,
        name: 'Pad Thai',
        place: 'Thai Orchid',
        price: 'Rs. 600',
        category: 'mains',
        cuisine: 'Thai',
        tags: ['noodles', 'thai', 'stir-fry', 'asian', 'peanuts'],
        priceRange: 'moderate',
        calories: '480 kcal',
        description: 'Classic Thai stir-fried noodles with peanuts.'
    },
    {
        id: 106,
        name: 'Vegetable Spring Rolls',
        place: 'Dragon Palace',
        price: 'Rs. 200',
        category: 'starters',
        cuisine: 'Chinese',
        tags: ['vegetarian', 'fried', 'spring-rolls', 'asian', 'crispy'],
        priceRange: 'budget',
        calories: '280 kcal',
        description: 'Crispy spring rolls with fresh vegetable filling.'
    },
    {
        id: 107,
        name: 'Butter Chicken',
        place: 'Taj Mahal',
        price: 'Rs. 700',
        category: 'mains',
        cuisine: 'Indian',
        tags: ['curry', 'chicken', 'indian', 'creamy', 'spicy'],
        priceRange: 'moderate',
        calories: '620 kcal',
        description: 'Creamy tomato-based curry with tender chicken.'
    },
    {
        id: 108,
        name: 'Margherita Pizza',
        place: 'La Pizzeria',
        price: 'Rs. 750',
        category: 'mains',
        cuisine: 'Italian',
        tags: ['pizza', 'vegetarian', 'italian', 'tomato', 'basil'],
        priceRange: 'moderate',
        calories: '700 kcal',
        description: 'Classic Italian pizza with fresh basil and mozzarella.'
    },
    {
        id: 109,
        name: 'Sushi Platter',
        place: 'Sakura Sushi',
        price: 'Rs. 1200',
        category: 'mains',
        cuisine: 'Japanese',
        tags: ['sushi', 'seafood', 'japanese', 'rice', 'asian'],
        priceRange: 'expensive',
        calories: '450 kcal',
        description: 'Assorted fresh sushi with wasabi and ginger.'
    },
    {
        id: 110,
        name: 'Fish and Chips',
        place: 'London Pub',
        price: 'Rs. 650',
        category: 'mains',
        cuisine: 'British',
        tags: ['fish', 'fried', 'chips', 'seafood', 'british'],
        priceRange: 'moderate',
        calories: '850 kcal',
        description: 'Classic British battered fish with crispy fries.'
    },
    {
        id: 111,
        name: 'Tandoori Chicken',
        place: 'Taj Mahal',
        price: 'Rs. 550',
        category: 'mains',
        cuisine: 'Indian',
        tags: ['chicken', 'indian', 'grilled', 'spicy', 'tandoor'],
        priceRange: 'moderate',
        calories: '420 kcal',
        description: 'Clay oven roasted chicken with aromatic spices.'
    },
    {
        id: 112,
        name: 'Pork MoMo',
        place: 'Everest MoMo',
        price: 'Rs. 280',
        category: 'starters',
        cuisine: 'Nepali',
        tags: ['steamed', 'pork', 'momo', 'asian', 'dumplings'],
        priceRange: 'budget',
        calories: '350 kcal',
        description: 'Traditional Nepali steamed dumplings with pork filling.'
    },
    {
        id: 113,
        name: 'Tom Yum Soup',
        place: 'Thai Orchid',
        price: 'Rs. 350',
        category: 'starters',
        cuisine: 'Thai',
        tags: ['soup', 'thai', 'spicy', 'asian', 'seafood'],
        priceRange: 'budget',
        calories: '180 kcal',
        description: 'Hot and sour Thai soup with shrimp.'
    },
    {
        id: 114,
        name: 'Chocolate Brownie',
        place: 'Sweet Treats',
        price: 'Rs. 300',
        category: 'desserts',
        cuisine: 'American',
        tags: ['chocolate', 'dessert', 'sweet', 'baked', 'american'],
        priceRange: 'budget',
        calories: '420 kcal',
        description: 'Rich chocolate brownie with vanilla ice cream.'
    },
    {
        id: 115,
        name: 'Garden Salad',
        place: 'Green Cafe',
        price: 'Rs. 250',
        category: 'starters',
        cuisine: 'International',
        tags: ['vegetarian', 'healthy', 'salad', 'fresh', 'light'],
        priceRange: 'budget',
        calories: '150 kcal',
        description: 'Fresh garden vegetables with olive oil dressing.'
    },
    {
        id: 116,
        name: 'Chicken Tikka',
        place: 'Taj Mahal',
        price: 'Rs. 400',
        category: 'starters',
        cuisine: 'Indian',
        tags: ['chicken', 'indian', 'grilled', 'spicy', 'tikka'],
        priceRange: 'moderate',
        calories: '320 kcal',
        description: 'Marinated chicken pieces grilled to perfection.'
    },
    {
        id: 117,
        name: 'Tonkotsu Ramen',
        place: 'Ichiraku Ramen',
        price: 'Rs. 500',
        category: 'mains',
        cuisine: 'Japanese',
        tags: ['ramen', 'japanese', 'soup', 'pork', 'asian'],
        priceRange: 'moderate',
        calories: '600 kcal',
        description: 'Creamy pork bone broth ramen with chashu.'
    },
    {
        id: 118,
        name: 'Veggie Burger',
        place: 'Burger House',
        price: 'Rs. 450',
        category: 'mains',
        cuisine: 'American',
        tags: ['vegetarian', 'burger', 'healthy', 'american', 'grilled'],
        priceRange: 'moderate',
        calories: '420 kcal',
        description: 'Plant-based patty with fresh toppings.'
    },
    {
        id: 119,
        name: 'Chicken Wings',
        place: 'Sports Bar',
        price: 'Rs. 400',
        category: 'starters',
        cuisine: 'American',
        tags: ['chicken', 'fried', 'spicy', 'american', 'wings'],
        priceRange: 'moderate',
        calories: '550 kcal',
        description: 'Crispy buffalo wings with blue cheese dip.'
    },
    {
        id: 120,
        name: 'Paneer Tikka',
        place: 'Taj Mahal',
        price: 'Rs. 350',
        category: 'starters',
        cuisine: 'Indian',
        tags: ['vegetarian', 'indian', 'grilled', 'paneer', 'spicy'],
        priceRange: 'budget',
        calories: '280 kcal',
        description: 'Grilled cottage cheese with Indian spices.'
    },
    {
        id: 121,
        name: 'Pepperoni Pizza',
        place: 'Pizza Hut',
        price: 'Rs. 900',
        category: 'mains',
        cuisine: 'Italian',
        tags: ['pizza', 'italian', 'pepperoni', 'meat', 'baked'],
        priceRange: 'moderate',
        calories: '820 kcal',
        description: 'Classic pepperoni pizza with extra cheese.'
    },
    {
        id: 122,
        name: 'Green Curry',
        place: 'Thai Orchid',
        price: 'Rs. 550',
        category: 'mains',
        cuisine: 'Thai',
        tags: ['curry', 'thai', 'spicy', 'asian', 'coconut'],
        priceRange: 'moderate',
        calories: '520 kcal',
        description: 'Creamy green curry with vegetables and meat.'
    },
    {
        id: 123,
        name: 'Chicken Biryani',
        place: 'Hyderabad House',
        price: 'Rs. 450',
        category: 'mains',
        cuisine: 'Indian',
        tags: ['rice', 'chicken', 'indian', 'spicy', 'biriyani'],
        priceRange: 'moderate',
        calories: '680 kcal',
        description: 'Aromatic basmati rice with spiced chicken.'
    },
    {
        id: 124,
        name: 'Dim Sum Platter',
        place: 'Dragon Palace',
        price: 'Rs. 800',
        category: 'starters',
        cuisine: 'Chinese',
        tags: ['steamed', 'chinese', 'dumplings', 'asian', 'seafood'],
        priceRange: 'moderate',
        calories: '380 kcal',
        description: 'Assorted steamed dumplings with dipping sauce.'
    },
    {
        id: 125,
        name: 'Mango Lassi',
        place: 'Taj Mahal',
        price: 'Rs. 150',
        category: 'drinks',
        cuisine: 'Indian',
        tags: ['drink', 'indian', 'sweet', 'mango', 'yogurt'],
        priceRange: 'budget',
        calories: '180 kcal',
        description: 'Refreshing mango yogurt drink.'
    }
];

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
        const ingredients = dish.ingredients.toLowerCase().split(/,\s*/);
        ingredients.forEach(ing => {
            if (ing.length > 2) tags.add(ing.trim());
        });
    }
    
    return Array.from(tags);
}

function calculateSimilarity(dish1: Dish, dish2: Dish): number {
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

export interface RecommendationScore {
    dish: Dish;
    score: number;
}

export function getRecommendations(
    likedDishes: Dish[],
    unlikedDishIds: number[],
    maxRecommendations: number = 10
): Dish[] {
    const likedIds = new Set(likedDishes.map(d => d.id));
    const excludedIds = new Set([...unlikedDishIds]);
    
    const candidateDishes = DISH_DATABASE.filter(d => !unlikedDishIds.includes(d.id));
    
    const recommendations: RecommendationScore[] = [];
    
    candidateDishes.forEach(candidate => {
        if (likedIds.has(candidate.id)) return;
        
        let totalScore = 0;
        let matchCount = 0;
        
        likedDishes.forEach(liked => {
            const similarity = calculateSimilarity(liked, candidate);
            if (similarity > 0) {
                totalScore += similarity;
                matchCount++;
            }
        });
        
        if (matchCount > 0) {
            const avgScore = totalScore / likedDishes.length;
            recommendations.push({ dish: candidate, score: avgScore });
        }
    });
    
    recommendations.sort((a, b) => b.score - a.score);
    
    const result: Dish[] = [];
    
    likedDishes.forEach(liked => {
        if (!excludedIds.has(liked.id)) {
            result.push(liked);
        }
    });
    
    const seenIds = new Set<number>(result.map(d => d.id));
    
    recommendations.forEach(rec => {
        if (!seenIds.has(rec.dish.id) && result.length < maxRecommendations) {
            result.push(rec.dish);
            seenIds.add(rec.dish.id);
        }
    });
    
    if (result.length < maxRecommendations && likedDishes.length === 0) {
        const shuffled = candidateDishes.sort(() => Math.random() - 0.5);
        shuffled.forEach(dish => {
            if (!seenIds.has(dish.id) && result.length < maxRecommendations) {
                result.push(dish);
                seenIds.add(dish.id);
            }
        });
    }
    
    return result;
}

export function getDishById(id: number): Dish | undefined {
    return DISH_DATABASE.find(d => d.id === id);
}

export { calculateSimilarity, normalizeTags };
