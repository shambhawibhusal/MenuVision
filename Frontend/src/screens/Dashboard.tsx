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
                <div style={{ padding: '20px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>Analysis Results</h2>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', marginBottom: '15px' }}>
                        <button
                            onClick={() => setViewMode('items')}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: viewMode === 'items' ? '#fbbf24' : '#444', color: viewMode === 'items' ? 'black' : 'white', fontWeight: 'bold' }}
                        >
                            Menu Items
                        </button>
                        <button
                            onClick={() => setViewMode('text')}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: viewMode === 'text' ? '#fbbf24' : '#444', color: viewMode === 'text' ? 'black' : 'white', fontWeight: 'bold' }}
                        >
                            Full Text
                        </button>
                    </div>

                    {viewMode === 'items' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {scannedItems.length === 0 && <p style={{ color: 'white' }}>No items found.</p>}
                            {scannedItems.map((item, index) => (
                                <div key={index} onClick={() => setSelectedDish(item)} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h3 style={{ margin: 0 }}>{item.name}</h3>
                                        <span style={{ color: 'green', fontWeight: 'bold' }}>{item.price}</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#666' }}>{item.description?.substring(0, 60)}...</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}>
                            {fullText || "No text extracted."}
                        </div>
                    )}

                    <button onClick={() => setActiveTab('home')} style={{ marginTop: '20px', padding: '12px', width: '100%', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px' }}>Scan Another</button>
                </div>
            );
        }

        if (activeTab === 'home') {
            return (
                <div style={{ padding: '20px', paddingTop: '40px' }}>
                    <input type="text" placeholder="Search dishes..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '30px', border: 'none', marginBottom: '20px' }} />

                    <div onClick={() => setShowScanOptions(true)} style={{ backgroundColor: '#22c55e', color: 'white', padding: '20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '30px' }}>
                        <div><h3 style={{ margin: 0 }}>Scan Menu</h3><p style={{ margin: 0, fontSize: '14px' }}>Click to take a photo</p></div>
                        <div style={{ fontSize: '30px' }}>📸</div>
                    </div>

                    <h3 style={{ color: 'white', marginBottom: '15px' }}>Recommended for You</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {filteredDishes.map(dish => {
                            const isLiked = favoriteItems.some(fav => fav.id === dish.id);
                            return (
                                <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '15px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{dish.name}</h3>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>{dish.place}</p>
                                        <strong style={{ color: '#22c55e' }}>{dish.price}</strong>
                                    </div>

                                    <div onClick={() => toggleRecommendedLike(dish)} style={{ cursor: 'pointer', fontSize: '20px' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                        {chatMessages.map(msg => (
                            <div key={msg.id} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.sender === 'user' ? '#3b82f6' : '#eee',
                                color: msg.sender === 'user' ? 'white' : 'black',
                                padding: '10px',
                                borderRadius: '15px',
                                marginBottom: '8px'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', padding: '10px' }}>
                        <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask about food..."
                            style={{ flex: 1, padding: '10px' }}
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </div>
            );
        }


        if (activeTab === 'profile') {
            const user = auth.currentUser;
            return (
                <div style={{ padding: '20px', color: 'white' }}>
                    <h2 style={{ marginBottom: '20px' }}>Your Profile</h2>
                    <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', color: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', marginBottom: '15px' }}>👤</div>
                        <h3 style={{ margin: 0 }}>{user?.displayName || 'Guest User'}</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>{user?.email || 'guest@example.com'}</p>

                        <button onClick={() => setShowEditProfile(true)} style={{ width: '100%', padding: '12px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', marginBottom: '10px' }}>Edit Profile</button>
                        <button onClick={onLogout} style={{ width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px' }}>Logout</button>
                    </div>
                </div>
            );
        }

        if (activeTab === 'history') {
            return (
                <div style={{ padding: '20px' }}>
                    <h2 style={{ color: 'white' }}>Order History</h2>

                    {historyItems.map(item => (
                        <div key={item.id} style={{ background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
                            <strong>{item.place}</strong>
                            <p>{item.items}</p>
                            <span>{item.total}</span>
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
        <div onClick={() => setActiveTab(name)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: activeTab === name ? '#3b82f6' : 'gray' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{path}</svg>
            <span style={{ fontSize: '11px' }}>{label}</span>
        </div>
    );

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="bg" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2 }}></div>

                <div style={{ flex: 1, overflowY: 'auto', zIndex: 3, position: 'relative' }}>{renderContent()}</div>

                <div style={{ height: '65px', backgroundColor: 'white', display: 'flex', alignItems: 'center', zIndex: 10 }}>
                    <NavIcon name="home" label="Home" path={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>} />
                    <NavIcon name="chat" label="Chat" path={<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7"></path>} />
                    <NavIcon name="profile" label="Profile" path={<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>} />
                    <NavIcon name="history" label="History" path={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />

                </div>

                {/* Overlays */}
                {showScanOptions && (
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', padding: '20px', zIndex: 100, borderTopLeftRadius: '20px' }}>
                        <button onClick={startCamera} style={{ display: 'block', width: '100%', padding: '15px', marginBottom: '10px' }}>Open Camera</button>
                        <input type="file" onChange={handleFileChange} style={{ display: 'block', width: '100%' }} />
                        <button onClick={() => setShowScanOptions(false)} style={{ width: '100%', marginTop: '10px' }}>Cancel</button>
                    </div>
                )}

                {showEditProfile && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', width: '85%' }}>
                            <h3>Edit Profile</h3>
                            <input placeholder="Full Name" style={{ width: '100%', marginBottom: '10px' }} />
                            <input placeholder="Phone" style={{ width: '100%', marginBottom: '10px' }} />
                            <button onClick={() => setShowEditProfile(false)}>Save</button>
                        </div>
                    </div>
                )}


                {capturedImage && (
                    <div style={{ position: 'absolute', top: 0, width: '100%', height: '100%', backgroundColor: 'black', zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={capturedImage} alt="Preview" style={{ width: '80%', borderRadius: '10px' }} />
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button onClick={() => setCapturedImage(null)} disabled={analyzing} style={{ background: 'red', color: 'white', padding: '10px 20px' }}>Retake</button>
                            <button onClick={analyzeMenu} disabled={analyzing} style={{ background: 'green', color: 'white', padding: '10px 20px' }}>
                                {analyzing ? "Thinking..." : "Analyze Menu"}
                            </button>
                        </div>
                    </div>
                )}

                {selectedDish && (
                    <div style={{ position: 'absolute', top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', width: '85%', borderRadius: '15px', padding: '20px' }}>
                            <h2>{selectedDish.name}</h2>
                            <p><strong>Calories:</strong> {selectedDish.calories}</p>
                            <p><strong>Ingredients:</strong> {selectedDish.ingredients}</p>
                            <p><strong>Description:</strong> {selectedDish.description}</p>
                            <button onClick={() => setSelectedDish(null)} style={{ width: '100%', padding: '10px', background: 'black', color: 'white' }}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;