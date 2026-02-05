export interface Dish {
    id: number;
    name: string;
    place: string;
    price: string;
}

export interface ScannedItem {
    name: string;
    price: string;
    calories?: string;
    ingredients?: string;
    description?: string;
}

export interface HistoryItem {
    id: number;
    place: string;
    date: string;
    items: string;
    total: string;
    scannedItems?: ScannedItem[];
}

export interface ChatMessage {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

export type Tab = 'home' | 'results' | 'chat' | 'profile' | 'history';
