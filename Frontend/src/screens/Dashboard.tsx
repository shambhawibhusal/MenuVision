import React, { useState, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import foodBackground from '../assets/food.png';
import { containerStyle } from '../utils/styles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Camera, History, User, MessageSquare, Home, Edit, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Types
import { Dish, ScannedItem, HistoryItem, ChatMessage, Tab } from '@/types/dashboard';

// Components
import HomeTab from '@/components/dashboard/HomeTab';
import ResultsTab from '@/components/dashboard/ResultsTab';
import ChatTab from '@/components/dashboard/ChatTab';
import ProfileTab from '@/components/dashboard/ProfileTab';
import HistoryTab from '@/components/dashboard/HistoryTab';
import NavIcon from '@/components/dashboard/NavIcon';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [favoriteItems, setFavoriteItems] = useState<Dish[]>([]);

    // -- Fetch User Data from Firestore
    React.useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) return;

            try {
                const userDocRef = doc(db, 'users', auth.currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.favorites) setFavoriteItems(data.favorites);
                    if (data.history) setHistoryItems(data.history);
                } else {
                    // Initialize user document if it doesn't exist
                    await setDoc(userDocRef, { favorites: [], history: [] });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, []);

    const toggleRecommendedLike = async (dish: Dish) => {
        if (!auth.currentUser) return;

        const isFav = favoriteItems.some(item => item.id === dish.id);
        const userDocRef = doc(db, 'users', auth.currentUser.uid);

        try {
            if (isFav) {
                setFavoriteItems(prev => prev.filter(item => item.id !== dish.id));
                await updateDoc(userDocRef, {
                    favorites: arrayRemove(dish)
                });
            } else {
                setFavoriteItems(prev => [...prev, dish]);
                await updateDoc(userDocRef, {
                    favorites: arrayUnion(dish)
                });
            }
        } catch (error) {
            console.error("Error updating favorites:", error);
            // Optionally rollback state or show alert
        }
    };
    // -- Data States
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [fullText, setFullText] = useState('');
    const [viewMode, setViewMode] = useState<'items' | 'text'>('items');
    const [selectedDish, setSelectedDish] = useState<ScannedItem | null>(null);
    const [searchText, setSearchText] = useState('');

    // -- Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: 1, text: "Hello! I am your Menu AI. Ask me about food.", sender: 'bot' }
    ]);
    const [chatInput, setChatInput] = useState('');

    // -- Profile Edit State
    const [showEditProfile, setShowEditProfile] = useState(false);

    // -- Recommended Dishes Data
    const [recommendedDishes] = useState<Dish[]>([
        { id: 101, name: 'Spicy Ramen', place: 'Ichiraku Ramen', price: 'Rs. 450' },
        { id: 102, name: 'Cheese Pizza', place: 'Pizza Hut', price: 'Rs. 800' },
        { id: 103, name: 'Chicken MoMo', place: 'Everest MoMo', price: 'Rs. 250' },
    ]);

    const filteredDishes = recommendedDishes.filter(dish =>
        dish.name.toLowerCase().includes(searchText.toLowerCase())
    );

    // -- Camera Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // -- Helper to resize images for API compliance
    const resizeImage = (blob: Blob): Promise<Blob> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                const MAX_DIM = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_DIM) {
                        height *= MAX_DIM / width;
                        width = MAX_DIM;
                    }
                } else {
                    if (height > MAX_DIM) {
                        width *= MAX_DIM / height;
                        height = MAX_DIM;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((resizedBlob) => {
                    resolve(resizedBlob || blob);
                }, 'image/jpeg', 0.8);
            };
            img.onerror = () => resolve(blob);
        });
    };

    // --- ANALYZE MENU ---
    const analyzeMenu = async () => {
        if (!imageBlob || analyzing) return;

        setAnalyzing(true);
        console.log("Starting analysis with blob:", {
            size: (imageBlob.size / 1024).toFixed(2) + " KB",
            type: imageBlob.type
        });

        try {
            const formData = new FormData();
            // Use .jpg for jpeg blobs, .png for others
            const extension = imageBlob.type === 'image/png' ? 'png' : 'jpg';
            formData.append('file', imageBlob, `menu.${extension}`);

            const response = await fetch('https://api.easyocr.org/ocr', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("OCR API Error Response:", errorText);
                throw new Error(`OCR API error ${response.status}: ${errorText || 'Unknown error'}`);
            }

            const result = await response.json();
            console.log("OCR Result:", result);

            let extractedText = "";
            let items: ScannedItem[] = [];

            if (result.words && Array.isArray(result.words)) {
                // 1. EXTRACT RAW DATA
                const rawWords = result.words.map((w: any) => {
                    let text = "";
                    let y = 0;
                    if (typeof w === 'string') {
                        text = w;
                    } else if (Array.isArray(w)) {
                        text = w[1] || "";
                        if (w[0] && Array.isArray(w[0])) {
                            y = w[0].reduce((acc: number, pt: any) => acc + (pt[1] || 0), 0) / w[0].length;
                        }
                    } else if (w && typeof w === 'object') {
                        text = w.text || w.word || "";
                        const box = w.box || w.coords || w.geometry;
                        if (Array.isArray(box) && box[0]) y = box[0][1] || 0;
                    }
                    return { text: text.trim(), y };
                }).filter((w: any) => w.text.length > 0);

                extractedText = rawWords.map((w: any) => w.text).join(' ');

                // 2. HYBRID PARSING LOGIC
                const parseItems = (wordList: any[]) => {
                    const detectedItems: ScannedItem[] = [];
                    const priceRegex = /(?:Rs\.?|Rs|NPR|\$|€|£)?\s?\d+(?:[\.,\s]\d{1,2})?/gi;
                    // Refined keywords to prevent filtering valid items like "Tea"
                    const headerKeywords = ['menu', 'items', 'list', 'page', 'restaurant', 'scanned', '~~~'];

                    // Method A: Line-based Spatial Grouping
                    const lines: { text: string, y: number }[] = [];
                    wordList.forEach((word: any) => {
                        // Reduced threshold from 25 to 10 to prevent merging separate rows
                        const existingLine = lines.find(l => Math.abs(l.y - word.y) < 10);
                        if (existingLine) existingLine.text += " " + word.text;
                        else lines.push({ text: word.text, y: word.y });
                    });

                    lines.forEach(line => {
                        const matches = line.text.match(priceRegex);
                        if (matches) {
                            // Assume the last match is the price (common in menus: "Burger ... $10")
                            const price = matches[matches.length - 1];
                            let name = line.text.replace(price, '').trim();

                            // Cleanup name
                            name = name.replace(/^[:;,. \-•*]+|[:;,. \-•*]+$/g, '');

                            if (name.length > 2 && !headerKeywords.some(k => name.toLowerCase().includes(k))) {
                                detectedItems.push({
                                    name: name,
                                    price: price,
                                    ingredients: "Freshly prepared",
                                    calories: "N/A",
                                    description: `Delicious ${name}`
                                });
                            }
                        }
                    });

                    // Method B: Token-Flow Fallback (if line parsing fails)
                    if (detectedItems.length === 0) {
                        for (let i = 1; i < wordList.length; i++) {
                            const current = wordList[i].text;
                            if (current.match(/^(?:Rs\.?|Rs|NPR|\$|€|£)?\s?\d+(?:[\.,]\d{1,2})?$/i)) {
                                let name = wordList[i - 1].text;
                                name = name.replace(/^•|[*\-]/g, '').trim();
                                if (name.length > 2 && !headerKeywords.includes(name.toLowerCase())) {
                                    detectedItems.push({
                                        name: name,
                                        price: current,
                                        ingredients: "Freshly sourced.",
                                        calories: "Estimated 300 kcal",
                                        description: `Enjoy our fresh ${name}.`
                                    });
                                }
                            }
                        }
                    }

                    // Method C: List-based Fallback (For menus without prices or failed price detection)
                    if (detectedItems.length === 0) {
                        console.log("No price-based items found. Using list fallback.");
                        lines.forEach(line => {
                            // Check if line contains multiple items separated by bullets/dots/pipes
                            // Delimiters:  。 | •  . (if surrounded by spaces)
                            const splitRegex = /[。•|]+|(?:\s{2,})|(?:\s+\.\s+)/;

                            const parts = line.text.split(splitRegex);

                            parts.forEach(part => {
                                // Aggressive cleaning
                                let cleanName = part.replace(/^[。•\-\*><\.]+|[。•\-\*><\.]+$/g, '').trim();
                                cleanName = cleanName.replace(/[0-9]/g, '');
                                cleanName = cleanName.replace(/^[:;,. ]+|[:;,. ]+$/g, '');

                                const isHeader = headerKeywords.some(k => cleanName.toLowerCase().includes(k)) || cleanName.length < 3;

                                if (cleanName && !isHeader) {
                                    detectedItems.push({
                                        name: cleanName,
                                        price: "Ask for Price",
                                        ingredients: "Fresh ingredients",
                                        calories: "N/A",
                                        description: `Our specialty: ${cleanName}`
                                    });
                                }
                            });
                        });
                    }

                    return detectedItems;
                };

                items = parseItems(rawWords);

                // Final unique filter
                items = items.filter((item, index, self) =>
                    index === self.findIndex((t) => t.name === item.name && t.price === item.price)
                );

            } else if (result.words) {
                extractedText = typeof result.words === 'string' ? result.words : JSON.stringify(result.words);
            }

            if (extractedText || items.length > 0) {
                const newHistoryItem: HistoryItem = {
                    id: Date.now(),
                    place: 'Scanned Menu',
                    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    items: items.slice(0, 2).map(i => i.name).join(', ') + (items.length > 2 ? '...' : ''),
                    total: items.length > 0 ? `${items.length} dishes found` : 'Text only',
                    scannedItems: items // Store full list
                };

                setHistoryItems(prev => [newHistoryItem, ...prev]);

                // Persist to Firestore with automatic document creation if missing
                if (auth.currentUser) {
                    const userDocRef = doc(db, 'users', auth.currentUser.uid);
                    await updateDoc(userDocRef, {
                        history: arrayUnion(newHistoryItem)
                    }).catch(async (error) => {
                        // Fallback if document doesn't exist yet
                        if (error.code === 'not-found') {
                            await setDoc(userDocRef, {
                                history: [newHistoryItem],
                                favorites: []
                            }, { merge: true });
                        } else {
                            console.error("Error saving history:", error);
                        }
                    });
                }

                setFullText(extractedText);
                setScannedItems(items);
                setCapturedImage(null);
                setActiveTab("results");
                // Correctly switch view based on results
                setViewMode(items.length > 0 ? 'items' : 'text');
            } else {
                alert("AI could not read the menu. Please try a clearer photo.");
            }
        } catch (err: any) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    // --- Camera Logic ---
    const startCamera = async () => {
        setIsCameraOpen(true);
        setShowScanOptions(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert("Camera access denied.");
            setIsCameraOpen(false);
        }
    };

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const resizedBlob = await resizeImage(blob);
                        setImageBlob(resizedBlob);
                        setCapturedImage(URL.createObjectURL(resizedBlob));
                    }
                }, 'image/jpeg', 0.9);
                stopCamera();
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    // Cleanup object URLs to prevent memory leaks
    React.useEffect(() => {
        return () => {
            if (capturedImage && capturedImage.startsWith('blob:')) {
                URL.revokeObjectURL(capturedImage);
            }
        };
    }, [capturedImage]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const resizedBlob = await resizeImage(file);
            setImageBlob(resizedBlob);
            setCapturedImage(URL.createObjectURL(resizedBlob));
            setShowScanOptions(false);
        }
    };

    const sendMessage = () => {
        if (!chatInput.trim()) return;
        setChatMessages([...chatMessages, { id: Date.now(), text: chatInput, sender: 'user' }]);
        setChatInput('');

        setTimeout(() => {
            setChatMessages(prev => [...prev, { id: Date.now() + 1, text: "I can help you choose dishes 🍽️", sender: 'bot' }]);
        }, 800);
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-[#1a1a1a]">
            <div className={containerStyle + " flex flex-col shadow-2xl relative overflow-hidden"}>
                <img src={foodBackground} alt="bg" className="absolute w-full h-full object-cover z-[1] opacity-70" />
                <div className="absolute w-full h-full bg-gradient-to-b from-black/80 via-black/40 to-black/90 z-[2]"></div>

                <main className="flex-1 overflow-y-auto z-[3] relative custom-scrollbar">
                    {activeTab === 'home' && (
                        <HomeTab
                            searchText={searchText}
                            setSearchText={setSearchText}
                            setShowScanOptions={setShowScanOptions}
                            filteredDishes={filteredDishes}
                            favoriteItems={favoriteItems}
                            toggleRecommendedLike={toggleRecommendedLike}
                        />
                    )}
                    {activeTab === 'results' && (
                        <ResultsTab
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            scannedItems={scannedItems}
                            setSelectedDish={setSelectedDish}
                            fullText={fullText}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {activeTab === 'chat' && (
                        <ChatTab
                            chatMessages={chatMessages}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            sendMessage={sendMessage}
                        />
                    )}
                    {activeTab === 'profile' && (
                        <ProfileTab
                            user={auth.currentUser}
                            setShowEditProfile={setShowEditProfile}
                            onLogout={onLogout}
                        />
                    )}
                    {activeTab === 'history' && (
                        <HistoryTab
                            historyItems={historyItems}
                            favoriteItems={favoriteItems}
                            toggleLike={toggleRecommendedLike}
                        />
                    )}
                </main>

                <nav className="h-20 bg-white/95 backdrop-blur-xl flex items-center px-4 z-[10] border-t border-gray-200">
                    <NavIcon name="home" label="Home" icon={<Home size={activeTab === 'home' ? 24 : 22} />} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <NavIcon name="chat" label="AI Chat" icon={<MessageSquare size={activeTab === 'chat' ? 24 : 22} />} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <NavIcon name="history" label="History" icon={<History size={activeTab === 'history' ? 24 : 22} />} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <NavIcon name="profile" label="Me" icon={<User size={activeTab === 'profile' ? 24 : 22} />} activeTab={activeTab} setActiveTab={setActiveTab} />
                </nav>

                {/* Overlays / Dialogs */}
                <Dialog open={showScanOptions} onOpenChange={setShowScanOptions}>
                    <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Camera className="text-amber-500" /> Choose Import
                            </DialogTitle>
                            <DialogDescription>Capture a new photo or upload an existing image of your menu.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Button onClick={startCamera} className="h-16 rounded-2xl gap-3 bg-black hover:bg-gray-800 text-lg font-bold">
                                <Camera /> Take Photo
                            </Button>
                            <div className="relative group">
                                <Button variant="outline" className="w-full h-16 rounded-2xl gap-3 border-gray-200 hover:bg-gray-50 text-lg font-bold">
                                    <Edit size={20} /> Choose from Library
                                </Button>
                                <Input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setShowScanOptions(false)} className="w-full text-gray-400">Cancel</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                    <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
                            <DialogDescription>Update your personal information and contact details.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 py-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input placeholder="John Doe" className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input placeholder="98XXXXXXXX" className="h-12 rounded-xl" />
                            </div>
                        </div>
                        <DialogFooter className="flex sm:flex-row gap-2">
                            <Button onClick={() => setShowEditProfile(false)} className="flex-1 h-12 rounded-xl bg-black font-bold">Save Changes</Button>
                            <Button variant="outline" onClick={() => setShowEditProfile(false)} className="flex-1 h-12 rounded-xl border-gray-200 font-bold">Cancel</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!selectedDish} onOpenChange={() => setSelectedDish(null)}>
                    <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                        <div className="h-32 bg-amber-400 relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedDish(null)}
                                className="absolute top-4 right-4 text-black hover:bg-black/10 rounded-full"
                            >
                                <X size={24} />
                            </Button>
                            <div className="absolute -bottom-10 left-8">
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl">🍲</div>
                            </div>
                        </div>
                        <div className="p-8 pt-12">
                            <DialogHeader className="sr-only">
                                <DialogTitle>{selectedDish?.name}</DialogTitle>
                                <DialogDescription>Details about {selectedDish?.name}, including ingredients and price.</DialogDescription>
                            </DialogHeader>
                            <h2 className="text-3xl font-black text-black mb-2">{selectedDish?.name}</h2>
                            <div className="text-green-600 text-xl font-bold mb-6">{selectedDish?.price}</div>

                            <div className="space-y-6">
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Ingredients</Label>
                                    <p className="text-gray-700 leading-relaxed mt-1">{selectedDish?.ingredients || 'No ingredients listed'}</p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Calories</Label>
                                        <p className="text-gray-900 font-bold mt-1 text-lg">{selectedDish?.calories || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Weight</Label>
                                        <p className="text-gray-900 font-bold mt-1 text-lg">Approx. 450g</p>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Description</Label>
                                    <p className="text-gray-600 leading-relaxed mt-1 italic">"{selectedDish?.description || 'A delicious dish prepared with fresh ingredients.'}"</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 pt-0 mt-4">
                            <Button onClick={() => setSelectedDish(null)} className="w-full h-14 rounded-2xl bg-black text-white text-lg font-bold">Got it!</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCameraOpen} onOpenChange={(open) => !open && stopCamera()}>
                    <DialogContent className="max-w-4xl p-0 h-[80vh] bg-black border-none overflow-hidden rounded-3xl">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Camera View</DialogTitle>
                            <DialogDescription>Live camera stream to capture and analyze the menu.</DialogDescription>
                        </DialogHeader>
                        <div className="relative w-full h-full flex flex-col shadow-2xl">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            <div className="absolute top-6 right-6 z-50">
                                <Button variant="ghost" size="icon" onClick={stopCamera} className="bg-white/20 backdrop-blur-md text-white hover:bg-white/40 rounded-full h-12 w-12">
                                    <X size={28} />
                                </Button>
                            </div>

                            <div className="absolute bottom-10 left-0 w-full flex justify-center items-center gap-8 z-50 px-6">
                                <div className="flex-1" />
                                <div className="relative">
                                    <div className="absolute -inset-2 rounded-full border-2 border-white/50 animate-ping opacity-20" />
                                    <button
                                        onClick={takePhoto}
                                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all outline-none"
                                    />
                                </div>
                                <div className="flex-1 flex justify-end">
                                    <div className="text-white text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest">Live Menu View</div>
                                </div>
                            </div>

                            <div className="absolute inset-0 border-[40px] border-black/10 pointer-events-none">
                                <div className="w-full h-full border-2 border-white/20 rounded-xl relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400" />
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {capturedImage && (
                    <div className="absolute inset-0 bg-black/95 z-[150] flex flex-col items-center justify-center p-6 animate-fade">
                        <Card className="max-w-sm w-full bg-transparent border-none shadow-none overflow-hidden">
                            <CardContent className="p-0">
                                <img src={capturedImage} alt="Preview" className="w-full rounded-3xl shadow-2xl border border-white/10" />
                            </CardContent>
                        </Card>
                        <div className="flex flex-col gap-4 mt-12 w-full max-w-sm">
                            <Button onClick={analyzeMenu} disabled={analyzing} className="h-16 rounded-2xl bg-amber-400 text-black hover:bg-amber-500 text-lg font-black shadow-[0_10px_30px_rgba(251,191,36,0.3)] disabled:opacity-50 transition-all">
                                {analyzing ? "AI is Reading Menu..." : "Analyze This Menu"}
                            </Button>
                            <Button variant="ghost" onClick={() => {
                                setCapturedImage(null);
                                setImageBlob(null);
                            }} disabled={analyzing} className="h-12 text-white/60 hover:text-white font-bold disabled:opacity-50">
                                Retake Photo
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;

