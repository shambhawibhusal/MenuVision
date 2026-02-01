import React, { useState, useRef } from 'react';
import { auth } from '../firebase';
import foodBackground from '../assets/food.png';
import { containerStyle } from '../utils/styles';

function Dashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('home');
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    // -- Data States
    const [scannedItems, setScannedItems] = useState([]);
    const [fullText, setFullText] = useState('');
    const [viewMode, setViewMode] = useState('items'); // 'items' or 'text'
    const [selectedDish, setSelectedDish] = useState(null);
    const [searchText, setSearchText] = useState('');

    // -- Search & Filter State
    const [showFilters, setShowFilters] = useState(false);

    // -- Chat State
    const [chatMessages, setChatMessages] = useState([
        { id: 1, text: "Hello! I am your Menu AI. Ask me about food.", sender: 'bot' }
    ]);
    const [chatInput, setChatInput] = useState('');

    // -- Profile Edit State
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editData, setEditData] = useState({ fullname: '', phone: '', password: '' });

    // -- Camera Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // --- ANALYZE MENU (Prevents multiple requests via 'analyzing' state) ---
    const analyzeMenu = async () => {
        if (!capturedImage || analyzing) return;

        setAnalyzing(true);
        try {
            const currentUser = auth.currentUser;
            const response = await fetch('http://localhost:5000/analyzeMenu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: capturedImage,
                    userId: currentUser ? currentUser.uid : 'guest'
                })
            });

            const data = await response.json();
            if (data.success) {
                setScannedItems(data.menuItems || []);
                setFullText(data.fullText || '');
                setCapturedImage(null);
                setActiveTab("results");
                setViewMode('items');
            } else {
                alert(data.error || "AI could not read the menu. Please try a clearer photo.");
            }
        } catch (err) {
            console.error(err);
            alert("Connection error: " + err.message);
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
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            setCapturedImage(canvas.toDataURL('image/png'));
            stopCamera();
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setCapturedImage(reader.result); setShowScanOptions(false); };
            reader.readAsDataURL(file);
        }
    };

    // --- Recommended Dishes Data ---
    const recommendedDishes = [
        { id: 101, name: 'Spicy Ramen', place: 'Hokkaido Ramen', price: 'Rs. 450', img: '🍜' },
        { id: 102, name: 'Butter Chicken', place: 'Tandoori Nights', price: 'Rs. 950', img: '🍛' },
    ];
    const filteredDishes = recommendedDishes.filter(dish => dish.name.toLowerCase().includes(searchText.toLowerCase()));

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

                    <div onClick={() => setShowScanOptions(true)} style={{ backgroundColor: '#22c55e', color: 'white', padding: '20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div><h3 style={{ margin: 0 }}>Scan Menu</h3><p style={{ margin: 0, fontSize: '14px' }}>Click to take a photo</p></div>
                        <div style={{ fontSize: '30px' }}>📸</div>
                    </div>
                </div>
            );
        }
    };

    const NavIcon = ({ name, label, path }) => (
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
                </div>

                {/* Overlays */}
                {showScanOptions && (
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', padding: '20px', zIndex: 100, borderTopLeftRadius: '20px' }}>
                        <button onClick={startCamera} style={{ display: 'block', width: '100%', padding: '15px', marginBottom: '10px' }}>Open Camera</button>
                        <input type="file" onChange={handleFileChange} style={{ display: 'block', width: '100%' }} />
                        <button onClick={() => setShowScanOptions(false)} style={{ width: '100%', marginTop: '10px' }}>Cancel</button>
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