import React, { useState, useRef } from 'react';
import { auth } from '../firebase';
import foodBackground from '../assets/food.png';
import { containerStyle } from '../utils/styles';

interface Dish {
    id: number;
    name: string;
    place: string;
    price: string;
}

interface ScannedItem {
    name: string;
    price: string;
    calories?: string;
    ingredients?: string;
    description?: string;
}

interface HistoryItem {
    id: number;
    place: string;
    date: string;
    items: string;
    total: string;
}

interface ChatMessage {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

type Tab = 'home' | 'results' | 'chat' | 'profile' | 'history';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const [historyView, setHistoryView] = useState('history');

    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
        { id: 1, place: 'Burger House', date: '20 Dec 2025', items: '2x Chicken Burger, 1x Coke', total: 'Rs. 550' },
    ]);

    const [favoriteItems, setFavoriteItems] = useState<Dish[]>([]);

    const toggleRecommendedLike = (dish: Dish) => {
        const isFav = favoriteItems.some(item => item.id === dish.id);
        if (isFav) {
            setFavoriteItems(favoriteItems.filter(item => item.id !== dish.id));
        } else {
            setFavoriteItems([...favoriteItems, dish]);
        }
    };
    // -- Data States
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [fullText, setFullText] = useState('');
    const [viewMode, setViewMode] = useState<'items' | 'text'>('items');
    const [selectedDish, setSelectedDish] = useState<ScannedItem | null>(null);
    const [searchText, setSearchText] = useState('');

    // -- Search & Filter State
    const [showFilters, setShowFilters] = useState(false);

    // -- Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: 1, text: "Hello! I am your Menu AI. Ask me about food.", sender: 'bot' }
    ]);
    const [chatInput, setChatInput] = useState('');

    // -- Profile Edit State
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editData, setEditData] = useState({ fullname: '', phone: '', password: '' });

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

    // --- ANALYZE MENU (Prevents multiple requests via 'analyzing' state) ---
    const analyzeMenu = async () => {
        if (!capturedImage || analyzing) return;

        setAnalyzing(true);
        try {
            // Convert data URL to Blob for FormData
            const responseBlob = await fetch(capturedImage);
            const blob = await responseBlob.blob();

            const formData = new FormData();
            formData.append('file', blob, 'menu.png');

            const response = await fetch('https://api.easyocr.org/ocr', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `OCR API error: ${response.status}`);
            }

            const result = await response.json();
            console.log("OCR result:", result);

            // Correctly handle if result.words is an array of objects [object Object]
            let extractedText = "";
            if (result.words && Array.isArray(result.words)) {
                extractedText = result.words.map((w: any) => {
                    if (typeof w === 'string') return w;
                    return w.text || w.word || JSON.stringify(w);
                }).join(' ');
            } else if (result.words) {
                extractedText = result.words;
            }

            if (extractedText) {
                setFullText(extractedText);
                setScannedItems([]);
                setCapturedImage(null);
                setActiveTab("results");
                setViewMode('text');
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
                setCapturedImage(canvas.toDataURL('image/png'));
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    setCapturedImage(result);
                }
                setShowScanOptions(false);
            };
            reader.readAsDataURL(file);
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
    // --- UI Render ---
    const renderContent = () => {
        if (activeTab === 'results') {
            return (
                <div className="p-5">
                    <h2 className="text-2xl font-bold text-white">Analysis Results</h2>

                    <div className="flex gap-[10px] mt-[15px] mb-[15px]">
                        <button
                            onClick={() => setViewMode('items')}
                            className={`flex-1 p-[10px] rounded-lg border-none font-bold ${viewMode === 'items' ? 'bg-amber-400 text-black' : 'bg-[#444] text-white'}`}
                        >
                            Menu Items
                        </button>
                        <button
                            onClick={() => setViewMode('text')}
                            className={`flex-1 p-[10px] rounded-lg border-none font-bold ${viewMode === 'text' ? 'bg-amber-400 text-black' : 'bg-[#444] text-white'}`}
                        >
                            Full Text
                        </button>
                    </div>

                    {viewMode === 'items' ? (
                        <div className="flex flex-col gap-[15px]">
                            {scannedItems.length === 0 && <p className="text-white">No items found.</p>}
                            {scannedItems.map((item, index) => (
                                <div key={index} onClick={() => setSelectedDish(item)} className="bg-white rounded-lg p-[15px] cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between">
                                        <h3 className="m-0 text-lg font-semibold text-black">{item.name}</h3>
                                        <span className="text-green-600 font-bold">{item.price}</span>
                                    </div>
                                    <p className="text-[13px] text-gray-600">{item.description?.substring(0, 60)}...</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg p-[15px] whitespace-pre-wrap max-h-[60vh] overflow-y-auto text-black">
                            {fullText || "No text extracted."}
                        </div>
                    )}

                    <button onClick={() => setActiveTab('home')} className="mt-5 p-3 w-full bg-blue-500 text-white border-none rounded-lg hover:bg-blue-600 transition-colors">Scan Another</button>
                </div>
            );
        }

        if (activeTab === 'home') {
            return (
                <div className="p-5 pt-10">
                    <input type="text" placeholder="Search dishes..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full p-3 rounded-full border-none mb-5 text-black focus:ring-2 focus:ring-amber-400 outline-none" />

                    <div onClick={() => setShowScanOptions(true)} className="bg-green-500 text-white p-5 rounded-2xl flex justify-between cursor-pointer mb-[30px] hover:bg-green-600 transition-colors">
                        <div><h3 className="m-0 text-lg font-bold">Scan Menu</h3><p className="m-0 text-[14px]">Click to take a photo</p></div>
                        <div className="text-[30px]">📸</div>
                    </div>

                    <h3 className="text-white mb-[15px] text-xl font-bold">Recommended for You</h3>
                    <div className="flex flex-col gap-[15px]">
                        {filteredDishes.map(dish => {
                            const isLiked = favoriteItems.some(fav => fav.id === dish.id);
                            return (
                                <div key={dish.id} className="bg-white rounded-2xl p-[15px] flex justify-between items-center shadow-sm">
                                    <div>
                                        <h3 className="m-0 mb-1 text-base font-bold text-black">{dish.name}</h3>
                                        <p className="m-0 mb-1 text-[13px] text-gray-600">{dish.place}</p>
                                        <strong className="text-green-600">{dish.price}</strong>
                                    </div>

                                    <div onClick={() => toggleRecommendedLike(dish)} className="cursor-pointer text-xl select-none hover:scale-110 transition-transform">
                                        {isLiked ? '❤️' : '🤍'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        if (activeTab === 'chat') {
            return (
                <div className="flex flex-col h-full bg-white">
                    <div className="flex-1 p-[15px] overflow-y-auto w-full">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`max-w-[80%] p-[10px] rounded-2xl mb-2 text-sm ${msg.sender === 'user' ? 'self-end bg-blue-500 text-white rounded-tr-none ml-auto' : 'self-start bg-gray-100 text-black rounded-tl-none mr-auto'}`}>
                                {msg.text}
                            </div>
                        ))}
                    </div>

                    <div className="flex p-[10px] border-t border-gray-100 bg-white">
                        <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask about food..."
                            className="flex-1 p-[10px] border border-gray-200 rounded-l-lg outline-none focus:border-blue-500 text-black"
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors">Send</button>
                    </div>
                </div>
            );
        }

        if (activeTab === 'profile') {
            const user = auth.currentUser;
            return (
                <div className="p-5 text-white">
                    <h2 className="mb-5 text-2xl font-bold">Your Profile</h2>
                    <div className="bg-white rounded-2xl p-5 text-black flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-[40px] mb-[15px]">👤</div>
                        <h3 className="m-0 text-xl font-bold">{user?.displayName || 'Guest User'}</h3>
                        <p className="text-gray-500 mb-5">{user?.email || 'guest@example.com'}</p>

                        <button onClick={() => setShowEditProfile(true)} className="w-full p-3 bg-black text-white border-none rounded-lg mb-[10px] font-bold hover:bg-gray-800 transition-colors">Edit Profile</button>
                        <button onClick={onLogout} className="w-full p-3 bg-red-500 text-white border-none rounded-lg font-bold hover:bg-red-600 transition-colors">Logout</button>
                    </div>
                </div>
            );
        }

        if (activeTab === 'history') {
            return (
                <div className="p-5">
                    <h2 className="text-2xl font-bold text-white mb-5">Order History</h2>

                    {historyItems.map(item => (
                        <div key={item.id} className="bg-white p-[15px] rounded-lg mb-[10px] shadow-sm">
                            <strong className="block text-black text-lg">{item.place}</strong>
                            <p className="text-gray-600 my-1">{item.items}</p>
                            <span className="text-green-600 font-bold">{item.total}</span>
                        </div>
                    ))}
                </div>
            );
        }
    };

    interface NavIconProps {
        name: Tab;
        label: string;
        path: React.ReactNode;
    }

    const NavIcon: React.FC<NavIconProps> = ({ name, label, path }) => (
        <div onClick={() => setActiveTab(name)} className={`flex-1 flex flex-col items-center cursor-pointer transition-colors ${activeTab === name ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-400`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{path}</svg>
            <span className="text-xs mt-0.5">{label}</span>
        </div>
    );

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-[#333]">
            <div className={containerStyle}>
                <img src={foodBackground} alt="bg" className="absolute w-full h-full object-cover z-[1]" />
                <div className="absolute w-full h-full bg-black/60 z-[2]"></div>

                <div className="flex-1 overflow-y-auto z-[3] relative">{renderContent()}</div>

                <div className="h-[65px] bg-white flex items-center z-[10] border-t border-gray-100">
                    <NavIcon name="home" label="Home" path={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>} />
                    <NavIcon name="chat" label="Chat" path={<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7"></path>} />
                    <NavIcon name="profile" label="Profile" path={<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>} />
                    <NavIcon name="history" label="History" path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />
                </div>

                {/* Overlays */}
                {showScanOptions && (
                    <div className="absolute bottom-0 w-full bg-white p-5 z-[100] rounded-t-2xl shadow-xl animate-slide-up">
                        <button onClick={startCamera} className="block w-full p-4 mb-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">Open Camera</button>
                        <div className="relative">
                            <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                        </div>
                        <button onClick={() => setShowScanOptions(false)} className="w-full mt-3 p-3 text-gray-500 hover:text-black transition-colors font-medium">Cancel</button>
                    </div>
                )}

                {showEditProfile && (
                    <div className="absolute inset-0 bg-black/70 flex justify-center items-center z-[200] backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-2xl w-[85%] shadow-2xl animate-fade">
                            <h3 className="text-xl font-bold mb-4 text-black">Edit Profile</h3>
                            <input placeholder="Full Name" className="w-full p-3 mb-3 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-black" />
                            <input placeholder="Phone" className="w-full p-3 mb-4 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-black" />
                            <div className="flex gap-2">
                                <button onClick={() => setShowEditProfile(false)} className="flex-1 p-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors">Save</button>
                                <button onClick={() => setShowEditProfile(false)} className="flex-1 p-3 bg-gray-100 text-black rounded-lg font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {capturedImage && (
                    <div className="absolute inset-0 bg-black z-[150] flex flex-col items-center justify-center">
                        <img src={capturedImage} alt="Preview" className="w-[80%] rounded-2xl shadow-2xl mb-8" />
                        <div className="flex gap-4">
                            <button onClick={() => setCapturedImage(null)} disabled={analyzing} className="bg-red-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50">Retake</button>
                            <button onClick={analyzeMenu} disabled={analyzing} className="bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 transition-colors disabled:opacity-50">
                                {analyzing ? "Thinking..." : "Analyze Menu"}
                            </button>
                        </div>
                    </div>
                )}

                {selectedDish && (
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-[200] backdrop-blur-sm">
                        <div className="bg-white w-[85%] rounded-2xl p-6 shadow-2xl animate-fade">
                            <h2 className="text-2xl font-bold mb-4 text-black">{selectedDish.name}</h2>
                            <div className="space-y-3 mb-6">
                                <p className="text-black"><strong className="text-gray-700">Calories:</strong> {selectedDish.calories || 'N/A'}</p>
                                <p className="text-black"><strong className="text-gray-700">Ingredients:</strong> {selectedDish.ingredients || 'N/A'}</p>
                                <p className="text-black leading-relaxed"><strong className="text-gray-700">Description:</strong> {selectedDish.description || 'N/A'}</p>
                            </div>
                            <button onClick={() => setSelectedDish(null)} className="w-full p-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;