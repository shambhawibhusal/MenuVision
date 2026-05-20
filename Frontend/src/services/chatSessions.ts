import { db, auth } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    increment,
    writeBatch,
} from 'firebase/firestore';
import { ChatSession, ChatMessage } from '@/types/dashboard';

const SESSIONS_COLLECTION = 'chatSessions';

const DEFAULT_WELCOME: ChatMessage = {
    id: 'welcome',
    text: 'Hello! I am your MenuVision. Ask me about food, ingredients, or anything on the menu!',
    sender: 'bot',
};

export const createChatSession = async (userId: string, title?: string): Promise<ChatSession | null> => {
    if (!auth.currentUser) return null;
    try {
        const sessionRef = doc(collection(db, SESSIONS_COLLECTION));
        const now = serverTimestamp();
        const session: Omit<ChatSession, 'id'> = {
            userId,
            title: title || 'New Chat',
            createdAt: now,
            updatedAt: now,
            lastMessage: DEFAULT_WELCOME.text.substring(0, 80),
            messageCount: 1,
        };
        await setDoc(sessionRef, session);

        const welcomeRef = doc(collection(db, SESSIONS_COLLECTION, sessionRef.id, 'messages'));
        await setDoc(welcomeRef, {
            text: DEFAULT_WELCOME.text,
            sender: 'bot',
            createdAt: now,
        });

        return { id: sessionRef.id, ...session } as ChatSession;
    } catch (error) {
        console.error('Error creating chat session:', error);
        return null;
    }
};

export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
    if (!auth.currentUser) return [];
    try {
        const q = query(
            collection(db, SESSIONS_COLLECTION),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        return [];
    }
};

export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    if (!auth.currentUser) return [];
    try {
        const q = query(
            collection(db, SESSIONS_COLLECTION, sessionId, 'messages'),
            orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                text: data.text,
                sender: data.sender,
                imageUrl: data.imageUrl || null,
                dishes: data.dishes || undefined,
                createdAt: data.createdAt,
            } as ChatMessage;
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return [];
    }
};

export const saveChatMessage = async (sessionId: string, message: ChatMessage): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
        const messagesRef = collection(db, SESSIONS_COLLECTION, sessionId, 'messages');
        const docRef = doc(messagesRef);
        await setDoc(docRef, {
            text: message.text,
            sender: message.sender,
            imageUrl: message.imageUrl || null,
            dishes: message.dishes || null,
            createdAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error saving chat message:', error);
        return false;
    }
};

export const updateSessionAfterMessage = async (
    sessionId: string,
    lastMessage: string,
): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        await updateDoc(sessionRef, {
            lastMessage: lastMessage.substring(0, 120),
            updatedAt: serverTimestamp(),
            messageCount: increment(1),
        });
        return true;
    } catch (error) {
        console.error('Error updating session after message:', error);
        return false;
    }
};

export const setSessionTitle = async (sessionId: string, title: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists() || sessionSnap.data()?.userId !== auth.currentUser.uid) return false;
        await updateDoc(sessionRef, { title, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error('Error renaming session:', error);
        return false;
    }
};

export const deleteChatSession = async (sessionId: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists() || sessionSnap.data()?.userId !== auth.currentUser.uid) return false;

        const messagesSnap = await getDocs(collection(db, SESSIONS_COLLECTION, sessionId, 'messages'));
        const batch = writeBatch(db);
        messagesSnap.docs.forEach(msgDoc => {
            batch.delete(msgDoc.ref);
        });
        batch.delete(sessionRef);
        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error deleting chat session:', error);
        return false;
    }
};
