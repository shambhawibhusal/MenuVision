import React, { useState, useRef, useEffect } from 'react';
import foodBackground from './assets/food.png';

// --- 1. FIREBASE IMPORTS (Updated) ---
import {
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    EmailAuthProvider,
    linkWithCredential,
    updateProfile,
    updatePassword,
    RecaptchaVerifier
} from 'firebase/auth';
// Added 'arrayUnion' to save lists of menus to the database
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from './firebase';

// --- BACK BUTTON COMPONENT ---
const BackButton = ({ onClick }) => (
    <div
        onClick={onClick}
        style={{
            position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px',
            backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 50
        }}
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    </div>
);

// --- CONTAINER STYLE ---
const containerStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '480px',
    height: '100vh',
    overflow: 'hidden',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column'
};

// ==========================================
// 1. SPLASH SCREEN
// ==========================================
function SplashScreen({ onGetStarted }) {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <style>
                {`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }
                    .animate-fade { animation: fadeIn 1.5s ease-out forwards; }
                    .animate-slide-1 { animation: slideUp 0.8s ease-out 0.2s forwards; opacity: 0; }
                    .animate-slide-2 { animation: slideUp 0.8s ease-out 0.4s forwards; opacity: 0; }
                    .animate-slide-3 { animation: slideUp 0.8s ease-out 0.6s forwards; opacity: 0; }
                    .btn-pulse { animation: pulse 2s infinite; }
                `}
            </style>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, filter: 'brightness(0.8)' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)', zIndex: 2 }}></div>
                <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '80px', color: 'white', textAlign: 'center', zIndex: 3 }}>
                    <div className="animate-fade" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.4)' }}><span style={{ fontSize: '40px' }}>🍽️</span></div>
                    </div>
                    <div className="animate-slide-1">
                        <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '5px', letterSpacing: '1px', textShadow: '0 4px 10px rgba(0,0,0,0.5)', fontFamily: 'sans-serif' }}>Menu<span style={{ color: '#fbbf24' }}>Vision</span></h1>
                        <p style={{ fontSize: '16px', fontWeight: '300', opacity: 0.9, letterSpacing: '2px', marginBottom: '40px', textTransform: 'uppercase' }}>SMART MENUS, SMART CHOICES</p>
                    </div>
                    <p className="animate-slide-2" style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '50px', padding: '0 30px', color: '#e5e7eb', maxWidth: '350px' }}>Discover delicious flavors and explore personalized dining experiences like never before.</p>
                    <button onClick={onGetStarted} className="animate-slide-3 btn-pulse" style={{ padding: '18px 60px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '50px', backgroundColor: '#fbbf24', color: 'black', cursor: 'pointer', boxShadow: '0 10px 25px rgba(251, 191, 36, 0.4)', transition: 'transform 0.2s', letterSpacing: '0.5px' }}>Get Started</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. LOGIN SCREEN
// ==========================================
function LoginScreen({ onBack, onSignupClick, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) { setError('All fields are required.'); return; }
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Login Successful!');
            onLoginSuccess();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found') setError('No account found. Please Sign Up first.');
            else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
            else if (err.code === 'auth/invalid-credential') setError('No account found or incorrect details.');
            else setError('Login failed.');
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
                <BackButton onClick={onBack} />
                <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Email:</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
                        </div>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: error ? '20px' : '60px' }}>
                            <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Password:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
                        </div>
                        {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
                        <button onClick={handleLogin} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '22px', fontWeight: '500', cursor: 'pointer', marginBottom: '20px' }}>Login</button>
                        <div style={{ fontSize: '16px', color: 'black' }}>Dont have account? <span onClick={onSignupClick} style={{ color: '#3b82f6', cursor: 'pointer' }}>Signup</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 3. SIGNUP SCREEN
// ==========================================
function SignupScreen({ onBack, onSignupSuccess }) {
    const [formData, setFormData] = useState({ email: '', fullname: '', phone: '', password: '', confirmPassword: '' });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSignupClick = async () => {
        const { email, fullname, phone, password, confirmPassword } = formData;
        if (!email || !fullname || !phone || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address.'); return; }
        if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) { setError('Phone number must be exactly 10 digits.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true); setError('');

        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                    'callback': (response) => { }
                });
            }
            const formattedPhoneNumber = `+977${phone}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setLoading(false); setShowOtpPopup(true); alert(`OTP sent to ${formattedPhoneNumber}`);
        } catch (err) {
            console.error(err); setLoading(false);
            if (err.code === 'auth/invalid-phone-number') setError('Invalid phone format. Add country code (e.g., +91).');
            else setError(err.message);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { alert('Please enter 6-digit OTP'); return; }
        setLoading(true);
        try {
            const phoneCredential = await window.confirmationResult.confirm(otp);
            const user = phoneCredential.user;
            const credential = EmailAuthProvider.credential(formData.email, formData.password);

            try {
                await linkWithCredential(user, credential);
            } catch (linkError) {
                if (linkError.code !== 'auth/provider-already-linked') throw linkError;
            }

            await updateProfile(user, { displayName: formData.fullname });
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid, fullname: formData.fullname, email: formData.email, phone: formData.phone, createdAt: new Date()
            });
            alert('Account Verified & Created!'); onSignupSuccess();
        } catch (err) {
            console.error(err); setLoading(false); alert('Verification Failed: ' + err.message);
        }
    };

    const rowStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' };
    const labelStyle = { fontSize: '18px', color: 'black', whiteSpace: 'nowrap' };
    const inputStyle = { width: '55%', height: '30px', border: '1px solid #555', paddingLeft: '5px' };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
                <BackButton onClick={onBack} />
                <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
                        <div style={rowStyle}><label style={labelStyle}>Email:</label><input name="email" onChange={handleChange} type="email" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Full name:</label><input name="fullname" onChange={handleChange} type="text" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Phone no:</label><input name="phone" placeholder="98XXXXXXXX" onChange={handleChange} type="tel" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Password:</label><input name="password" onChange={handleChange} type="password" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Confirm:</label><input name="confirmPassword" onChange={handleChange} type="password" style={{ ...inputStyle, width: '35%' }} /></div>
                        {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
                        <button onClick={handleSignupClick} disabled={loading} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '20px', fontWeight: '500', cursor: 'pointer' }}>{loading ? 'Processing...' : 'Sign Up'}</button>
                    </div>
                </div>
                {showOtpPopup && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px', textAlign: 'center' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold' }}>Verification</h3>
                            <p style={{ marginBottom: '20px' }}>Enter the OTP sent to <br /><b>+977 {formData.phone}</b></p>
                            <input type="number" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: '100%', height: '45px', fontSize: '22px', textAlign: 'center', letterSpacing: '5px', marginBottom: '20px', border: '2px solid #ccc', borderRadius: '5px' }} />
                            <button onClick={handleVerifyOtp} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Verify Code</button>
                            <button onClick={() => setShowOtpPopup(false)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                        </div>
                    </div>
                )}
                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
}

// ==========================================
// 4. DASHBOARD SCREEN
// ==========================================
function Dashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('home');
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    // -- Data States
    const [scannedItems, setScannedItems] = useState([]); // Stores data from AI
    const [selectedDish, setSelectedDish] = useState(null); // Controls Details Modal

    // -- Edit Profile
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editData, setEditData] = useState({ fullname: '', phone: '', password: '' });

    // -- History/Favorites
    const [historyView, setHistoryView] = useState('history');
    const [historyItems, setHistoryItems] = useState([]);
    const [favoriteItems, setFavoriteItems] = useState([]);

    // -- Search
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // -- Chat
    const [chatMessages, setChatMessages] = useState([{ id: 1, text: "Hello! Ask me about the menu.", sender: 'bot' }]);
    const [chatInput, setChatInput] = useState('');

    // -- Camera
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // --- STEP 2: ANALYZE MENU (REACT-ONLY AI) ---
    const analyzeMenu = async () => {
        if (!capturedImage) return;
        setAnalyzing(true);

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert("You must be logged in to analyze a menu.");
                setAnalyzing(false);
                return;
            }

            const response = await fetch('http://localhost:5000/analyzeMenu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: capturedImage, userId: currentUser.uid })
            });

            const data = await response.json();
            console.log(data.menuItems);

            if (!response.ok) throw new Error("Backend analysis failed");

            setScannedItems(data.menuItems || []); // Use the returned menuItems
            setCapturedImage(null);
            setActiveTab("results");

        } catch (err) {
            console.error(err);
            alert("Analysis Failed: " + err.message);
        } finally {
            setAnalyzing(false);
        }
    };


    // --- OTHER HELPERS ---
    const deleteHistory = (id) => setHistoryItems(historyItems.filter(item => item.id !== id));
    const removeFavorite = (id) => setFavoriteItems(favoriteItems.filter(item => item.id !== id));
    const toggleRecommendedLike = (dish) => {
        // ... (existing logic) ...
        const isFav = favoriteItems.some(item => item.id === dish.id);
        if (isFav) setFavoriteItems(favoriteItems.filter(item => item.id !== dish.id));
        else setFavoriteItems([...favoriteItems, { id: dish.id, name: dish.name, place: dish.place, price: dish.price, rating: dish.rating }]);
    };

    // ... (Profile Logic, Camera Logic, Chat Logic remains same) ...
    // To save space in this answer, I kept the rest identical to previous versions. 
    // Just ensure 'analyzeMenu' above replaces the old fetch version.

    const openEditProfile = () => { setEditData({ fullname: auth.currentUser?.displayName || '', phone: '', password: '' }); setShowEditProfile(true); };
    const handleSaveProfile = async () => { /* ... same as before ... */ };
    const startCamera = async () => { setIsCameraOpen(true); setShowScanOptions(false); try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); if (videoRef.current) { videoRef.current.srcObject = stream; } } catch (err) { alert("Error: " + err.message); setIsCameraOpen(false); } };
    const takePhoto = () => { const video = videoRef.current; const canvas = canvasRef.current; if (video && canvas) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; const context = canvas.getContext('2d'); context.drawImage(video, 0, 0, canvas.width, canvas.height); setCapturedImage(canvas.toDataURL('image/png')); stopCamera(); } };
    const stopCamera = () => { if (videoRef.current && videoRef.current.srcObject) { videoRef.current.srcObject.getTracks().forEach(track => track.stop()); videoRef.current.srcObject = null; } setIsCameraOpen(false); };
    const handleFileChange = (event) => { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setCapturedImage(reader.result); setShowScanOptions(false); }; reader.readAsDataURL(file); } };
    const sendMessage = () => { /* ... same as before ... */ };

    // --- DATA (Recommended Dishes) ---
    const recommendedDishes = [
        { id: 101, name: 'Spicy Ramen', place: 'Hokkaido Ramen', price: 'Rs. 450', img: '🍜', rating: '4.7' },
        { id: 102, name: 'Butter Chicken', place: 'Tandoori Nights', price: 'Rs. 950', img: '🍛', rating: '4.9' },
        { id: 103, name: 'Crispy Fried Chicken', place: 'KFC', price: 'Rs. 800', img: '🍗', rating: '4.6' },
        { id: 104, name: 'Margherita Pizza', place: 'Fire & Ice', price: 'Rs. 1100', img: '🍕', rating: '4.5' },
    ];
    const filteredDishes = recommendedDishes.filter(dish => dish.name.toLowerCase().includes(searchText.toLowerCase()));

    // --- RENDER CONTENT ---
    const renderContent = () => {
        if (activeTab === 'results') {
            return (
                <div style={{ padding: '20px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>Scanned Menu</h2>
                    {scannedItems.length === 0 && <p>No items found.</p>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {scannedItems.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => setSelectedDish(item)}
                                style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', borderLeft: item.type?.toLowerCase().includes('non') ? '5px solid red' : '5px solid green' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h3>
                                    <span style={{ fontWeight: 'bold', color: 'green' }}>{item.price}</span>
                                </div>
                                <p style={{ fontSize: '14px', color: 'gray', margin: '5px 0' }}>{item.description}</p>
                                <span style={{ fontSize: '12px', background: '#eee', padding: '3px 8px', borderRadius: '5px' }}>Click for details</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setActiveTab('home')} style={{ marginTop: '20px', padding: '10px', width: '100%', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px' }}>Back to Home</button>
                </div>
            );
        }

        // ... (Keep existing Home, Chat, History, Profile Tabs same as before) ...
        // I'm abbreviating here to fit the response limit, but in your file keep the full switch statement
        if (activeTab === 'home') {
            return (
                <div style={{ padding: '20px', paddingTop: '40px', color: 'black' }}>
                    {/* Search Bar & Filter */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <input type="text" placeholder="Search dishes..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ flex: 1, padding: '12px 15px', borderRadius: '30px', border: 'none', backgroundColor: '#f3f4f6' }} />
                    </div>

                    {/* Scan Button */}
                    <div onClick={() => setShowScanOptions(true)} style={{ backgroundColor: '#22c55e', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div><h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Scan Menu</h3><p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Upload image of your menu.</p></div>
                        <div style={{ fontSize: '30px' }}>📸</div>
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '15px', textShadow: '1px 1px black' }}>Recommended Dishes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {filteredDishes.map(dish => (
                            <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '15px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ fontSize: '40px', marginRight: '15px' }}>{dish.img}</div>
                                    <div><div style={{ fontWeight: 'bold', fontSize: '18px' }}>{dish.name}</div><div style={{ fontSize: '14px', color: 'gray' }}>{dish.place}</div><div style={{ color: '#eab308', fontWeight: 'bold' }}>{dish.price}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const NavIcon = ({ name, label, path }) => (
        <div onClick={() => setActiveTab(name)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeTab === name ? '#3b82f6' : 'gray', height: '100%' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
            <span style={{ fontSize: '11px', marginTop: '4px' }}>{label}</span>
        </div>
    );

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)', zIndex: 2 }}></div>
                <div style={{ flex: 1, overflowY: 'auto', zIndex: 3 }}>{renderContent()}</div>
                <div style={{ height: '65px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 10, borderTop: '1px solid #ddd' }}>
                    <NavIcon name="home" label="Home" path={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>} />
                    <NavIcon name="chat" label="Chat" path={<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>} />
                    <NavIcon name="history" label="History" path={<><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>} />
                    <NavIcon name="profile" label="Profile" path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>} />
                </div>

                {/* --- POPUPS --- */}
                {showScanOptions && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowScanOptions(false)}>
                        <div style={{ width: '100%', backgroundColor: 'white', padding: '20px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
                            <h3>Upload Menu</h3>
                            <label style={{ display: 'block', padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>Take Photo <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} /></label>
                            <label style={{ display: 'block', padding: '15px', cursor: 'pointer' }}>Upload from Gallery <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} /></label>
                        </div>
                    </div>
                )}
                {capturedImage && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={capturedImage} alt="Preview" style={{ width: '80%', marginBottom: '20px' }} />
                        {analyzing ? <div style={{ color: 'white', fontSize: '20px' }}>Processing with AI...</div> : <div style={{ display: 'flex', gap: '20px' }}><button onClick={() => setCapturedImage(null)} style={{ padding: '10px 20px', background: 'red', color: 'white', border: 'none' }}>Retake</button><button onClick={analyzeMenu} style={{ padding: '10px 20px', background: 'green', color: 'white', border: 'none' }}>Analyze Menu</button></div>}
                    </div>
                )}
                {selectedDish && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', width: '85%', borderRadius: '15px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '5px' }}>{selectedDish.name}</h2>
                            <p style={{ color: 'green', fontWeight: 'bold', marginBottom: '15px' }}>{selectedDish.price}</p>
                            <div style={{ marginBottom: '15px' }}><strong>Description:</strong><p>{selectedDish.description}</p></div>
                            <div style={{ marginBottom: '15px' }}><strong>Ingredients:</strong><p>{selectedDish.ingredients}</p></div>
                            <div style={{ marginBottom: '15px' }}><strong>Calories:</strong><p>{selectedDish.calories}</p></div>
                            <button onClick={() => setSelectedDish(null)} style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: 'white', border: 'none', borderRadius: '5px' }}>Close</button>
                        </div>
                    </div>
                )}
                {isCameraOpen && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', zIndex: 200 }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        <button onClick={takePhoto} style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'white' }}></button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// 5. MAIN APP CONTROLLER
// ==========================================
export default function App() {
    const [currentScreen, setCurrentScreen] = useState('splash');
    return (
        <>
            {currentScreen === 'splash' && <SplashScreen onGetStarted={() => setCurrentScreen('login')} />}
            {currentScreen === 'login' && <LoginScreen onBack={() => setCurrentScreen('splash')} onSignupClick={() => setCurrentScreen('signup')} onLoginSuccess={() => setCurrentScreen('dashboard')} />}
            {currentScreen === 'signup' && <SignupScreen onBack={() => setCurrentScreen('splash')} onSignupSuccess={() => setCurrentScreen('dashboard')} />}
            {currentScreen === 'dashboard' && <Dashboard onLogout={() => setCurrentScreen('splash')} />}
        </>
    );
}