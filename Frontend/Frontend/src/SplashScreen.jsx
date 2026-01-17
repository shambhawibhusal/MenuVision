import React, { useState, useRef, useEffect } from 'react';
import foodBackground from './assets/food.png';

// --- FIREBASE IMPORTS ---
import {
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    EmailAuthProvider,
    linkWithCredential,
    updateProfile,
    updatePassword,
    RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
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
// 1. SPLASH SCREEN (YOUR REQUESTED VERSION)
// ==========================================
function SplashScreen({ onGetStarted }) {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            {/* CSS Animations Restored */}
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

            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '480px',
                height: '100vh',
                // SCROLLING ENABLED: Ensures animations don't push button off-screen
                overflowY: 'auto',
                overflowX: 'hidden',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                scrollbarWidth: 'none' // Hide scrollbar
            }}>
                {/* 1. Background Image */}
                <img
                    src={foodBackground}
                    alt="Food background"
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        objectFit: 'cover', zIndex: 1,
                        filter: 'brightness(0.8)'
                    }}
                />

                {/* 2. Gradient Overlay */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                    zIndex: 2
                }}></div>

                {/* 3. Content Layer */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center',
                    zIndex: 3,
                    padding: '20px',
                    boxSizing: 'border-box'
                }}>

                    {/* Logo / Icon (Fade In) */}
                    <div className="animate-fade" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.4)' }}>
                            <span style={{ fontSize: '40px' }}>🍽️</span>
                        </div>
                    </div>

                    {/* Title (Slide Up 1) */}
                    <div className="animate-slide-1">
                        <h1 style={{
                            fontSize: '42px', fontWeight: '800', marginBottom: '5px',
                            letterSpacing: '1px', textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            fontFamily: 'sans-serif'
                        }}>
                            Menu<span style={{ color: '#fbbf24' }}>Vision</span>
                        </h1>
                        <p style={{ fontSize: '16px', fontWeight: '300', opacity: 0.9, letterSpacing: '2px', marginBottom: '30px', textTransform: 'uppercase' }}>
                            SMART MENUS, SMART CHOICES
                        </p>
                    </div>

                    {/* Description (Slide Up 2) */}
                    <p className="animate-slide-2" style={{
                        fontSize: '16px', lineHeight: '1.6', marginBottom: '40px',
                        padding: '0 10px', color: '#e5e7eb', maxWidth: '350px'
                    }}>
                        Discover delicious flavors and explore personalized dining experiences like never before.
                    </p>

                    {/* Button (Slide Up 3 + Pulse) */}
                    <button
                        onClick={onGetStarted}
                        className="btn-pulse"
                        style={{
                            padding: '18px 60px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '50px',
                            backgroundColor: '#fbbf24',
                            color: 'black',
                            cursor: 'pointer',
                            boxShadow: '0 10px 25px rgba(251, 191, 36, 0.4)',
                            letterSpacing: '0.5px',
                            marginBottom: '20px'
                        }}
                    >
                        Get Started
                    </button>
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

    // --- STEP 1: VALIDATE & OPEN POPUP ---
    const handleSignupClick = async () => {
        const { email, fullname, phone, password, confirmPassword } = formData;

        if (!email || !fullname || !phone || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address.'); return; }
        if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) { setError('Phone number must be exactly 10 digits.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

        setLoading(true);
        setError('');

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

            setLoading(false);
            setShowOtpPopup(true);
            alert(`OTP sent to ${formattedPhoneNumber}`);

        } catch (err) {
            console.error(err);
            setLoading(false);
            if (err.code === 'auth/invalid-phone-number') setError('Invalid phone format. Add country code (e.g., +91).');
            else setError(err.message);
        }
    };

    // --- STEP 2: VERIFY OTP ---
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { alert('Please enter 6-digit OTP'); return; }
        setLoading(true);

        try {
            const phoneCredential = await window.confirmationResult.confirm(otp);
            const user = phoneCredential.user;

            const credential = EmailAuthProvider.credential(formData.email, formData.password);
            await linkWithCredential(user, credential);
            await updateProfile(user, { displayName: formData.fullname });

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullname: formData.fullname,
                email: formData.email,
                phone: formData.phone,
                createdAt: new Date()
            });

            alert('Account Verified & Created!');
            onSignupSuccess();

        } catch (err) {
            console.error(err);
            setLoading(false);
            alert('Verification Failed: ' + err.message);
        }
    };

    const rowStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' };
    const labelStyle = { fontSize: '18px', color: 'black', whiteSpace: 'nowrap' };
    const inputStyle = { width: '55%', height: '30px', borderRadius: '5px', border: '1px solid #555', paddingLeft: '5px' };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
                <BackButton onClick={onBack} />

                <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '20px' }}>
                        <div style={rowStyle}><label style={labelStyle}>Email:</label><input name="email" onChange={handleChange} type="email" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Full name:</label><input name="fullname" onChange={handleChange} type="text" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Phone no:</label><input name="phone" placeholder="10 digits numbers" onChange={handleChange} type="tel" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Password:</label><input name="password" onChange={handleChange} type="password" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Confirm Password:</label><input name="confirmPassword" onChange={handleChange} type="password" style={{ ...inputStyle, width: '48%' }} /></div>

                        {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
                        <button onClick={handleSignupClick} disabled={loading} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '20px', fontWeight: '500', cursor: 'pointer' }}>
                            {loading ? 'Processing...' : 'Sign Up'}
                        </button>
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
    const [historyView, setHistoryView] = useState('history');

    // -- Search & Filter State
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // -- Chat State
    const [chatMessages, setChatMessages] = useState([
        { id: 1, text: "Hello! I am your Menu AI. Ask me about food.", sender: 'bot' }
    ]);
    const [chatInput, setChatInput] = useState('');

    // -- Profile Edit State
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editData, setEditData] = useState({ fullname: '', phone: '', password: '' });

    // -- Camera stream refs
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // --- DATA ---
    const allDishes = [
        { id: 101, name: 'Spicy Ramen', place: 'Hokkaido Ramen', price: 'Rs. 450', img: '🍜', rating: '4.7', type: 'non-veg' },
        { id: 102, name: 'Butter Chicken', place: 'Tandoori Nights', price: 'Rs. 950', img: '🍛', rating: '4.9', type: 'non-veg' },
        { id: 103, name: 'Crispy Fried Chicken', place: 'KFC', price: 'Rs. 800', img: '🍗', rating: '4.6', type: 'non-veg' },
        { id: 104, name: 'Margherita Pizza', place: 'Fire & Ice', price: 'Rs. 1100', img: '🍕', rating: '4.5', type: 'veg' },
        { id: 105, name: 'Mixed Momo Platter', place: 'Momo Magic', price: 'Rs. 600', img: '🥟', rating: '4.8', type: 'non-veg' },
        { id: 106, name: 'Veg Burger', place: 'Burger House', price: 'Rs. 300', img: '🍔', rating: '4.2', type: 'veg' },
    ];

    // Filter Logic
    const filteredDishes = allDishes.filter(dish =>
        dish.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const [historyItems, setHistoryItems] = useState([
        { id: 1, place: 'Burger House', date: '20 Dec 2025', items: '2x Chicken Burger, 1x Coke', total: 'Rs. 550' },
        { id: 2, place: 'Pizza Hut', date: '15 Dec 2025', items: '1x Pepperoni Pizza (L)', total: 'Rs. 1200' },
    ]);

    const [favoriteItems, setFavoriteItems] = useState([
        { id: 101, name: 'Spicy Ramen', place: 'Hokkaido Ramen', price: 'Rs. 450', rating: '4.7' },
    ]);

    // --- HELPER FUNCTIONS ---
    const deleteHistory = (id) => setHistoryItems(historyItems.filter(item => item.id !== id));
    const removeFavorite = (id) => setFavoriteItems(favoriteItems.filter(item => item.id !== id));

    const toggleRecommendedLike = (dish) => {
        const isFav = favoriteItems.some(item => item.id === dish.id);
        if (isFav) setFavoriteItems(favoriteItems.filter(item => item.id !== dish.id));
        else setFavoriteItems([...favoriteItems, { id: dish.id, name: dish.name, place: dish.place, price: dish.price, rating: dish.rating }]);
    };

    const openEditProfile = () => {
        setEditData({ fullname: auth.currentUser?.displayName || '', phone: '', password: '' });
        setShowEditProfile(true);
    };

    const handleSaveProfile = async () => {
        try {
            const user = auth.currentUser;
            if (editData.fullname) await updateProfile(user, { displayName: editData.fullname });
            if (editData.password && editData.password.length >= 6) await updatePassword(user, editData.password);
            if (editData.fullname || editData.phone) {
                await updateDoc(doc(db, 'users', user.uid), { fullname: editData.fullname, phone: editData.phone });
            }
            alert("Profile Updated Successfully!");
            setShowEditProfile(false);
        } catch (error) { console.error(error); alert("Update Failed: " + error.message); }
    };

    // --- CAMERA FUNCTIONS ---
    const startCamera = async () => { setIsCameraOpen(true); setShowScanOptions(false); try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); if (videoRef.current) { videoRef.current.srcObject = stream; } } catch (err) { alert("Error opening camera: " + err.message); setIsCameraOpen(false); } };
    const takePhoto = () => { const video = videoRef.current; const canvas = canvasRef.current; if (video && canvas) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; const context = canvas.getContext('2d'); context.drawImage(video, 0, 0, canvas.width, canvas.height); setCapturedImage(canvas.toDataURL('image/png')); stopCamera(); } };
    const stopCamera = () => { if (videoRef.current && videoRef.current.srcObject) { videoRef.current.srcObject.getTracks().forEach(track => track.stop()); videoRef.current.srcObject = null; } setIsCameraOpen(false); };
    const handleFileChange = (event) => { const file = event.target.files[0]; if (file) { setCapturedImage(URL.createObjectURL(file)); setShowScanOptions(false); } };

    // --- CHAT FUNCTION ---
    const sendMessage = () => {
        if (!chatInput.trim()) return;
        const newMsg = { id: Date.now(), text: chatInput, sender: 'user' };
        setChatMessages([...chatMessages, newMsg]);
        setChatInput('');
        setTimeout(() => {
            setChatMessages(prev => [...prev, { id: Date.now() + 1, text: "I can help you find dishes. Try searching in the Dashboard!", sender: 'bot' }]);
        }, 1000);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <div style={{ padding: '20px', paddingTop: '20px', color: 'black', width: '100%', boxSizing: 'border-box' }}>

                        {/* SEARCH & FILTER BAR */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search dishes..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{ width: '100%', padding: '12px 15px', borderRadius: '30px', border: 'none', backgroundColor: '#f3f4f6', fontSize: '16px', boxSizing: 'border-box' }}
                                />
                                <span style={{ position: 'absolute', right: '15px', top: '12px', color: 'gray' }}>🔍</span>
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '10px', borderRadius: '50%', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                            </button>
                        </div>

                        {/* FILTER POPUP */}
                        {showFilters && (
                            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Filters</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button style={{ padding: '5px 15px', borderRadius: '15px', border: '1px solid #ddd', background: 'white' }}>Veg</button>
                                    <button style={{ padding: '5px 15px', borderRadius: '15px', border: '1px solid #ddd', background: 'white' }}>Non-Veg</button>
                                    <button style={{ padding: '5px 15px', borderRadius: '15px', border: '1px solid #ddd', background: 'white' }}>Spicy</button>
                                </div>
                            </div>
                        )}

                        {/* SCAN MENU BUTTON (Moved to Home) */}
                        <div
                            onClick={() => setShowScanOptions(true)}
                            style={{
                                backgroundColor: '#22c55e', color: 'white', padding: '20px', borderRadius: '15px',
                                marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: 'pointer', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Scan Menu</h3>
                                <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Upload image of your menu.</p>
                            </div>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' }}>
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '15px', textShadow: '1px 1px black' }}>Recommended Dishes</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {filteredDishes.map(dish => {
                                const isLiked = favoriteItems.some(fav => fav.id === dish.id);
                                return (
                                    <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '15px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ fontSize: '40px', marginRight: '15px' }}>{dish.img}</div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{dish.name}</div>
                                                <div style={{ fontSize: '14px', color: 'gray' }}>{dish.place}</div>
                                                <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '16px', marginTop: '4px' }}>{dish.price}</div>
                                            </div>
                                        </div>
                                        <div onClick={() => toggleRecommendedLike(dish)} style={{ cursor: 'pointer', padding: '10px' }}>
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill={isLiked ? "red" : "none"} stroke={isLiked ? "red" : "#ccc"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            // --- NEW CHAT TAB ---
            case 'chat':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' }}>
                        <div style={{ padding: '15px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                            Menu AI Assistant
                        </div>
                        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {chatMessages.map(msg => (
                                <div key={msg.id} style={{
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    backgroundColor: msg.sender === 'user' ? '#3b82f6' : '#f3f4f6',
                                    color: msg.sender === 'user' ? 'white' : 'black',
                                    padding: '10px 15px', borderRadius: '15px', maxWidth: '75%'
                                }}>
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex' }}>
                            <input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask about food..."
                                style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', marginRight: '10px' }}
                            />
                            <button onClick={sendMessage} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>Send</button>
                        </div>
                    </div>
                );

            case 'history':
                return (
                    <div style={{ padding: '20px', paddingTop: '40px', color: 'black', paddingBottom: '80px', width: '100%', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{ backgroundColor: 'white', borderRadius: '30px', padding: '5px', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                                <button onClick={() => setHistoryView('history')} style={{ padding: '8px 25px', borderRadius: '25px', border: 'none', backgroundColor: historyView === 'history' ? '#3b82f6' : 'transparent', color: historyView === 'history' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>History</button>
                                <button onClick={() => setHistoryView('favorites')} style={{ padding: '8px 25px', borderRadius: '25px', border: 'none', backgroundColor: historyView === 'favorites' ? '#3b82f6' : 'transparent', color: historyView === 'favorites' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>Favorites</button>
                            </div>
                        </div>
                        {historyView === 'history' ? (
                            <>
                                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px black', textAlign: 'center', marginBottom: '15px' }}>Order History</h2>
                                {historyItems.map((item) => (
                                    <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{item.place}</span>
                                            <span style={{ color: 'gray', fontSize: '14px' }}>{item.date}</span>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#555', marginBottom: '10px', width: '85%' }}>{item.items}</div>
                                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'green' }}>{item.total}</div>
                                        <div onClick={() => deleteHistory(item.id)} style={{ position: 'absolute', bottom: '15px', left: '15px', cursor: 'pointer', color: 'red' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px black', textAlign: 'center', marginBottom: '15px' }}>Your Favorites</h2>
                                {favoriteItems.map((item) => (
                                    <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>{item.name}</div>
                                            <div style={{ color: 'gray', fontSize: '14px' }}>{item.place}</div>
                                            <div style={{ color: 'green', fontWeight: 'bold', marginTop: '5px' }}>{item.price}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '5px' }}>★ {item.rating}</span>
                                            <div onClick={() => removeFavorite(item.id)} style={{ cursor: 'pointer' }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                );
            case 'profile':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                        <div style={{ width: '100px', height: '100px', backgroundColor: 'white', borderRadius: '50%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '30px' }}>
                            {auth.currentUser?.displayName?.charAt(0) || 'U'}
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{auth.currentUser?.displayName || 'User'}</h2>
                        <p style={{ fontSize: '16px', marginBottom: '20px', opacity: 0.8 }}>{auth.currentUser?.email}</p>

                        <button onClick={openEditProfile} style={{ padding: '10px 30px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
                            Edit Profile
                        </button>

                        <button onClick={onLogout} style={{ padding: '12px 40px', fontSize: '18px', fontWeight: 'bold', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                            Logout
                        </button>
                    </div>
                );
            default: return null;
        }
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

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', zIndex: 3, position: 'relative', scrollbarWidth: 'none' }}>
                    {renderContent()}
                </div>

                {/* Bottom Nav */}
                <div style={{ height: '65px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 10, borderTop: '1px solid #ddd' }}>
                    <NavIcon name="home" label="Home" path={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>} />
                    <NavIcon name="chat" label="Chat" path={<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>} />
                    <NavIcon name="history" label="History" path={<><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>} />
                    <NavIcon name="profile" label="Profile" path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>} />
                </div>

                {/* --- EDIT PROFILE POPUP --- */}
                {showEditProfile && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>Edit Profile</h3>

                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
                            <input
                                type="text"
                                value={editData.fullname}
                                onChange={(e) => setEditData({ ...editData, fullname: e.target.value })}
                                style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '15px' }}
                            />

                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone No (Database)</label>
                            <input
                                type="tel"
                                placeholder="Update Phone..."
                                value={editData.phone}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '15px' }}
                            />

                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password</label>
                            <input
                                type="password"
                                placeholder="Leave empty to keep current"
                                value={editData.password}
                                onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                                style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '20px' }}
                            />

                            <button onClick={handleSaveProfile} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Save Changes</button>
                            <button onClick={() => setShowEditProfile(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#f3f4f6', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* --- CAMERA/UPLOAD POPUP --- */}
                {showScanOptions && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowScanOptions(false)}>
                        <div style={{ width: '100%', backgroundColor: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', paddingBottom: '40px', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ width: '40px', height: '5px', backgroundColor: '#ddd', borderRadius: '10px', margin: '0 auto 20px auto' }}></div>
                            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>Upload Menu</h3>
                            <div onClick={startCamera} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div>
                                <span style={{ fontSize: '18px' }}>Take Photo</span>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', padding: '15px', cursor: 'pointer' }}>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
                                <span style={{ fontSize: '18px' }}>Upload from Gallery</span>
                            </label>
                            <button onClick={() => setShowScanOptions(false)} style={{ width: '100%', padding: '15px', marginTop: '10px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* --- FULL SCREEN CAMERA OVERLAY --- */}
                {isCameraOpen && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        <div style={{ position: 'absolute', bottom: '30px', display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
                            <button onClick={stopCamera} style={{ color: 'white', background: 'none', border: 'none', fontSize: '18px' }}>Cancel</button>
                            <button onClick={takePhoto} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'white', border: '5px solid #ccc' }}></button>
                            <div style={{ width: '50px' }}></div>
                        </div>
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

// import React, { useState, useRef, useEffect } from 'react';
// import foodBackground from './assets/food.png';

// // --- FIREBASE IMPORTS ---
// import {
//     signInWithEmailAndPassword,
//     signInWithPhoneNumber,
//     EmailAuthProvider,
//     linkWithCredential,
//     updateProfile,
//     updatePassword,
//     RecaptchaVerifier
// } from 'firebase/auth';
// import { doc, setDoc, updateDoc } from 'firebase/firestore';
// import { auth, db } from './firebase';

// // --- BACK BUTTON COMPONENT ---
// const BackButton = ({ onClick }) => (
//     <div
//         onClick={onClick}
//         style={{
//             position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px',
//             backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
//             justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 50
//         }}
//     >
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M15 18l-6-6 6-6" />
//         </svg>
//     </div>
// );

// // --- CONTAINER STYLE ---
// const containerStyle = {
//     position: 'relative',
//     width: '100%',
//     maxWidth: '480px',
//     height: '100vh',
//     overflow: 'hidden',
//     boxShadow: '0 0 20px rgba(0,0,0,0.5)',
//     backgroundColor: 'white',
//     display: 'flex',
//     flexDirection: 'column'
// };

// // ==========================================
// // 1. SPLASH SCREEN
// // ==========================================
// function SplashScreen({ onGetStarted }) {
//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             {/* CSS Animations Restored */}
//             <style>
//                 {`
//                     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//                     @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//                     @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }
//                     .animate-fade { animation: fadeIn 1.5s ease-out forwards; }
//                     .animate-slide-1 { animation: slideUp 0.8s ease-out 0.2s forwards; opacity: 0; }
//                     .animate-slide-2 { animation: slideUp 0.8s ease-out 0.4s forwards; opacity: 0; }
//                     .animate-slide-3 { animation: slideUp 0.8s ease-out 0.6s forwards; opacity: 0; }
//                     .btn-pulse { animation: pulse 2s infinite; }
//                 `}
//             </style>

//             <div style={{
//                 position: 'relative',
//                 width: '100%',
//                 maxWidth: '480px',
//                 height: '100vh',
//                 // SCROLLING ENABLED: Ensures animations don't push button off-screen
//                 overflowY: 'auto',
//                 overflowX: 'hidden',
//                 boxShadow: '0 0 20px rgba(0,0,0,0.5)',
//                 backgroundColor: 'white',
//                 display: 'flex',
//                 flexDirection: 'column',
//                 scrollbarWidth: 'none' // Hide scrollbar
//             }}>
//                 {/* 1. Background Image */}
//                 <img
//                     src={foodBackground}
//                     alt="Food background"
//                     style={{
//                         position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//                         objectFit: 'cover', zIndex: 1,
//                         filter: 'brightness(0.8)'
//                     }}
//                 />

//                 {/* 2. Gradient Overlay */}
//                 <div style={{
//                     position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//                     background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
//                     zIndex: 2
//                 }}></div>

//                 {/* 3. Content Layer */}
//                 <div style={{
//                     position: 'relative',
//                     width: '100%',
//                     minHeight: '100vh',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     color: 'white',
//                     textAlign: 'center',
//                     zIndex: 3,
//                     padding: '20px',
//                     boxSizing: 'border-box'
//                 }}>

//                     {/* Logo / Icon (Fade In) */}
//                     <div className="animate-fade" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                         <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.4)' }}>
//                             <span style={{ fontSize: '40px' }}>🍽️</span>
//                         </div>
//                     </div>

//                     {/* Title (Slide Up 1) */}
//                     <div className="animate-slide-1">
//                         <h1 style={{
//                             fontSize: '42px', fontWeight: '800', marginBottom: '5px',
//                             letterSpacing: '1px', textShadow: '0 4px 10px rgba(0,0,0,0.5)',
//                             fontFamily: 'sans-serif'
//                         }}>
//                             Menu<span style={{ color: '#fbbf24' }}>Vision</span>
//                         </h1>
//                         <p style={{ fontSize: '16px', fontWeight: '300', opacity: 0.9, letterSpacing: '2px', marginBottom: '30px', textTransform: 'uppercase' }}>
//                             SMART MENUS, SMART CHOICES
//                         </p>
//                     </div>

//                     {/* Description (Slide Up 2) */}
//                     <p className="animate-slide-2" style={{
//                         fontSize: '16px', lineHeight: '1.6', marginBottom: '40px',
//                         padding: '0 10px', color: '#e5e7eb', maxWidth: '350px'
//                     }}>
//                         Discover delicious flavors and explore personalized dining experiences like never before.
//                     </p>

//                     {/* Button (Slide Up 3 + Pulse) */}
//                     <button
//                         onClick={onGetStarted}
//                         className="btn-pulse"
//                         style={{
//                             padding: '18px 60px',
//                             fontSize: '18px',
//                             fontWeight: 'bold',
//                             border: 'none',
//                             borderRadius: '50px',
//                             backgroundColor: '#fbbf24',
//                             color: 'black',
//                             cursor: 'pointer',
//                             boxShadow: '0 10px 25px rgba(251, 191, 36, 0.4)',
//                             letterSpacing: '0.5px',
//                             marginBottom: '20px'
//                         }}
//                     >
//                         Get Started
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }
// // ==========================================
// // 3. SIGNUP SCREEN
// // ==========================================
// function SignupScreen({ onBack, onSignupSuccess }) {
//     const [formData, setFormData] = useState({ email: '', fullname: '', phone: '', password: '', confirmPassword: '' });
//     const [otp, setOtp] = useState('');
//     const [error, setError] = useState('');
//     const [showOtpPopup, setShowOtpPopup] = useState(false);
//     const [loading, setLoading] = useState(false);

//     const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//     // --- STEP 1: VALIDATE & OPEN POPUP ---
//     const handleSignupClick = async () => {
//         const { email, fullname, phone, password, confirmPassword } = formData;

//         if (!email || !fullname || !phone || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
//         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address.'); return; }
//         if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) { setError('Phone number must be exactly 10 digits.'); return; }
//         if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
//         if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

//         setLoading(true);
//         setError('');

//         try {
//             if (!window.recaptchaVerifier) {
//                 window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
//                     'size': 'invisible',
//                     'callback': (response) => { }
//                 });
//             }

//             const formattedPhoneNumber = `+977${phone}`;
//             const appVerifier = window.recaptchaVerifier;
//             const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
//             window.confirmationResult = confirmationResult;

//             setLoading(false);
//             setShowOtpPopup(true);
//             alert(`OTP sent to ${formattedPhoneNumber}`);

//         } catch (err) {
//             console.error(err);
//             setLoading(false);
//             if (err.code === 'auth/invalid-phone-number') setError('Invalid phone format. Add country code (e.g., +91).');
//             else setError(err.message);
//         }
//     };

//     // --- STEP 2: VERIFY OTP ---
//     const handleVerifyOtp = async () => {
//         if (otp.length !== 6) { alert('Please enter 6-digit OTP'); return; }
//         setLoading(true);

//         try {
//             const phoneCredential = await window.confirmationResult.confirm(otp);
//             const user = phoneCredential.user;

//             const credential = EmailAuthProvider.credential(formData.email, formData.password);
//             await linkWithCredential(user, credential);
//             await updateProfile(user, { displayName: formData.fullname });

//             await setDoc(doc(db, "users", user.uid), {
//                 uid: user.uid,
//                 fullname: formData.fullname,
//                 email: formData.email,
//                 phone: formData.phone,
//                 createdAt: new Date()
//             });

//             alert('Account Verified & Created!');
//             onSignupSuccess();

//         } catch (err) {
//             console.error(err);
//             setLoading(false);
//             alert('Verification Failed: ' + err.message);
//         }
//     };

//     const rowStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' };
//     const labelStyle = { fontSize: '18px', color: 'black', whiteSpace: 'nowrap' };
//     const inputStyle = { width: '55%', height: '30px', border: '1px solid #555', paddingLeft: '5px' };

//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             <div style={containerStyle}>
//                 <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
//                 <BackButton onClick={onBack} />

//                 <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
//                     <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
//                         <div style={rowStyle}><label style={labelStyle}>Email:</label><input name="email" onChange={handleChange} type="email" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Full name:</label><input name="fullname" onChange={handleChange} type="text" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Phone no:</label><input name="phone" placeholder="98XXXXXXXX" onChange={handleChange} type="tel" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Password:</label><input name="password" onChange={handleChange} type="password" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Confirm:</label><input name="confirmPassword" onChange={handleChange} type="password" style={{ ...inputStyle, width: '35%' }} /></div>

//                         {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
//                         <button onClick={handleSignupClick} disabled={loading} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '20px', fontWeight: '500', cursor: 'pointer' }}>
//                             {loading ? 'Processing...' : 'Sign Up'}
//                         </button>
//                     </div>
//                 </div>

//                 {showOtpPopup && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px', textAlign: 'center' }}>
//                             <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold' }}>Verification</h3>
//                             <p style={{ marginBottom: '20px' }}>Enter the OTP sent to <br /><b>+977 {formData.phone}</b></p>
//                             <input type="number" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: '100%', height: '45px', fontSize: '22px', textAlign: 'center', letterSpacing: '5px', marginBottom: '20px', border: '2px solid #ccc', borderRadius: '5px' }} />
//                             <button onClick={handleVerifyOtp} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Verify Code</button>
//                             <button onClick={() => setShowOtpPopup(false)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}
//                 <div id="recaptcha-container"></div>
//             </div>
//         </div>
//     );
// }

// // ==========================================
// // 4. DASHBOARD SCREEN
// // ==========================================
// function Dashboard({ onLogout }) {
//     const [activeTab, setActiveTab] = useState('home'); // 'home', 'chat', 'history', 'profile'
//     const [showScanOptions, setShowScanOptions] = useState(false);
//     const [capturedImage, setCapturedImage] = useState(null);
//     const [historyView, setHistoryView] = useState('history');

//     // -- Search & Filter State
//     const [searchText, setSearchText] = useState('');
//     const [showFilters, setShowFilters] = useState(false);

//     // -- Chat State
//     const [chatMessages, setChatMessages] = useState([
//         { id: 1, text: "Hello! I am your Menu AI. Ask me about food.", sender: 'bot' }
//     ]);
//     const [chatInput, setChatInput] = useState('');

//     // -- Profile Edit State
//     const [showEditProfile, setShowEditProfile] = useState(false);
//     const [editData, setEditData] = useState({ fullname: '', phone: '', password: '' });

//     // -- Camera stream refs
//     const [isCameraOpen, setIsCameraOpen] = useState(false);
//     const videoRef = useRef(null);
//     const canvasRef = useRef(null);

//     // --- DATA ---
//     const allDishes = [
//         { id: 101, name: 'Spicy Ramen', place: 'Hokkaido Ramen', price: 'Rs. 450', img: '🍜', rating: '4.7', type: 'non-veg' },
//         { id: 102, name: 'Butter Chicken', place: 'Tandoori Nights', price: 'Rs. 950', img: '🍛', rating: '4.9', type: 'non-veg' },
//         { id: 103, name: 'Crispy Fried Chicken', place: 'KFC', price: 'Rs. 800', img: '🍗', rating: '4.6', type: 'non-veg' },
//         { id: 104, name: 'Margherita Pizza', place: 'Fire & Ice', price: 'Rs. 1100', img: '🍕', rating: '4.5', type: 'veg' },
//         { id: 105, name: 'Mixed Momo Platter', place: 'Momo Magic', price: 'Rs. 600', img: '🥟', rating: '4.8', type: 'non-veg' },
//         { id: 106, name: 'Veg Burger', place: 'Burger House', price: 'Rs. 300', img: '🍔', rating: '4.2', type: 'veg' },
//     ];

//     // Filter Logic
//     const filteredDishes = allDishes.filter(dish =>
//         dish.name.toLowerCase().includes(searchText.toLowerCase())
//     );

//     const [historyItems, setHistoryItems] = useState([
//         { id: 1, place: 'Burger House', date: '20 Dec 2025', items: '2x Chicken Burger, 1x Coke', total: 'Rs. 550' },
//         { id: 2, place: 'Pizza Hut', date: '15 Dec 2025', items: '1x Pepperoni Pizza (L)', total: 'Rs. 1200' },
//     ]);

//     const [favoriteItems, setFavoriteItems] = useState([
//         { id: 101, name: 'Spicy Ramen', place: 'Hokkaido Ramen', price: 'Rs. 450', rating: '4.7' },
//     ]);

//     // --- HELPER FUNCTIONS ---
//     const deleteHistory = (id) => setHistoryItems(historyItems.filter(item => item.id !== id));
//     const removeFavorite = (id) => setFavoriteItems(favoriteItems.filter(item => item.id !== id));

//     const toggleRecommendedLike = (dish) => {
//         const isFav = favoriteItems.some(item => item.id === dish.id);
//         if (isFav) setFavoriteItems(favoriteItems.filter(item => item.id !== dish.id));
//         else setFavoriteItems([...favoriteItems, { id: dish.id, name: dish.name, place: dish.place, price: dish.price, rating: dish.rating }]);
//     };

//     const openEditProfile = () => {
//         setEditData({ fullname: auth.currentUser?.displayName || '', phone: '', password: '' });
//         setShowEditProfile(true);
//     };

//     const handleSaveProfile = async () => {
//         try {
//             const user = auth.currentUser;
//             if (editData.fullname) await updateProfile(user, { displayName: editData.fullname });
//             if (editData.password && editData.password.length >= 6) await updatePassword(user, editData.password);
//             if (editData.fullname || editData.phone) {
//                 await updateDoc(doc(db, 'users', user.uid), { fullname: editData.fullname, phone: editData.phone });
//             }
//             alert("Profile Updated Successfully!");
//             setShowEditProfile(false);
//         } catch (error) { console.error(error); alert("Update Failed: " + error.message); }
//     };

//     // --- CAMERA FUNCTIONS ---
//     const startCamera = async () => { setIsCameraOpen(true); setShowScanOptions(false); try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); if (videoRef.current) { videoRef.current.srcObject = stream; } } catch (err) { alert("Error opening camera: " + err.message); setIsCameraOpen(false); } };
//     const takePhoto = () => { const video = videoRef.current; const canvas = canvasRef.current; if (video && canvas) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; const context = canvas.getContext('2d'); context.drawImage(video, 0, 0, canvas.width, canvas.height); setCapturedImage(canvas.toDataURL('image/png')); stopCamera(); } };
//     const stopCamera = () => { if (videoRef.current && videoRef.current.srcObject) { videoRef.current.srcObject.getTracks().forEach(track => track.stop()); videoRef.current.srcObject = null; } setIsCameraOpen(false); };
//     const handleFileChange = (event) => { const file = event.target.files[0]; if (file) { setCapturedImage(URL.createObjectURL(file)); setShowScanOptions(false); } };

//     // --- CHAT FUNCTION ---
//     const sendMessage = () => {
//         if (!chatInput.trim()) return;
//         const newMsg = { id: Date.now(), text: chatInput, sender: 'user' };
//         setChatMessages([...chatMessages, newMsg]);
//         setChatInput('');
//         // Simulated AI Response
//         setTimeout(() => {
//             setChatMessages(prev => [...prev, { id: Date.now() + 1, text: "I can help you find dishes. Try searching in the Dashboard!", sender: 'bot' }]);
//         }, 1000);
//     };

//     const renderContent = () => {
//         switch (activeTab) {
//             case 'home':
//                 return (
//                     <div style={{ padding: '20px', paddingTop: '20px', color: 'black', width: '100%', boxSizing: 'border-box' }}>

//                         {/* SEARCH & FILTER BAR */}
//                         <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
//                             <div style={{ flex: 1, position: 'relative' }}>
//                                 <input
//                                     type="text"
//                                     placeholder="Search dishes..."
//                                     value={searchText}
//                                     onChange={(e) => setSearchText(e.target.value)}
//                                     style={{ width: '100%', padding: '12px 15px', borderRadius: '30px', border: 'none', backgroundColor: '#f3f4f6', fontSize: '16px', boxSizing: 'border-box' }}
//                                 />
//                                 <span style={{ position: 'absolute', right: '15px', top: '12px', color: 'gray' }}>🔍</span>
//                             </div>
//                             <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '10px', borderRadius: '50%', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
//                             </button>
//                         </div>

//                         {/* FILTER POPUP */}
//                         {showFilters && (
//                             <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
//                                 <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Filters</p>
//                                 <div style={{ display: 'flex', gap: '10px' }}>
//                                     <button style={{ padding: '5px 15px', borderRadius: '15px', border: '1px solid #ddd', background: 'white' }}>Veg</button>
//                                     <button style={{ padding: '5px 15px', borderRadius: '15px', border: '1px solid #ddd', background: 'white' }}>Non-Veg</button>
//                                     <button style={{ padding: '5px 15px', borderRadius: '15px', border: '1px solid #ddd', background: 'white' }}>Spicy</button>
//                                 </div>
//                             </div>
//                         )}

//                         {/* SCAN MENU BUTTON (Moved to Home) */}
//                         <div
//                             onClick={() => setShowScanOptions(true)}
//                             style={{
//                                 backgroundColor: '#22c55e', color: 'white', padding: '20px', borderRadius: '15px',
//                                 marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                                 cursor: 'pointer', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
//                             }}
//                         >
//                             <div>
//                                 <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Scan Menu</h3>
//                                 <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Upload image of your menu.</p>
//                             </div>
//                             <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' }}>
//                                 <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
//                             </div>
//                         </div>

//                         <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '15px', textShadow: '1px 1px black' }}>Recommended Dishes</h3>
//                         <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//                             {filteredDishes.map(dish => {
//                                 const isLiked = favoriteItems.some(fav => fav.id === dish.id);
//                                 return (
//                                     <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '15px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
//                                         <div style={{ display: 'flex', alignItems: 'center' }}>
//                                             <div style={{ fontSize: '40px', marginRight: '15px' }}>{dish.img}</div>
//                                             <div>
//                                                 <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{dish.name}</div>
//                                                 <div style={{ fontSize: '14px', color: 'gray' }}>{dish.place}</div>
//                                                 <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '16px', marginTop: '4px' }}>{dish.price}</div>
//                                             </div>
//                                         </div>
//                                         <div onClick={() => toggleRecommendedLike(dish)} style={{ cursor: 'pointer', padding: '10px' }}>
//                                             <svg width="28" height="28" viewBox="0 0 24 24" fill={isLiked ? "red" : "none"} stroke={isLiked ? "red" : "#ccc"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 );

//             // --- NEW CHAT TAB ---
//             case 'chat':
//                 return (
//                     <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' }}>
//                         <div style={{ padding: '15px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
//                             Menu AI Assistant
//                         </div>
//                         <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                             {chatMessages.map(msg => (
//                                 <div key={msg.id} style={{
//                                     alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
//                                     backgroundColor: msg.sender === 'user' ? '#3b82f6' : '#f3f4f6',
//                                     color: msg.sender === 'user' ? 'white' : 'black',
//                                     padding: '10px 15px', borderRadius: '15px', maxWidth: '75%'
//                                 }}>
//                                     {msg.text}
//                                 </div>
//                             ))}
//                         </div>
//                         <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex' }}>
//                             <input
//                                 value={chatInput}
//                                 onChange={(e) => setChatInput(e.target.value)}
//                                 placeholder="Ask about food..."
//                                 style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', marginRight: '10px' }}
//                             />
//                             <button onClick={sendMessage} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>Send</button>
//                         </div>
//                     </div>
//                 );

//             case 'history':
//                 return (
//                     <div style={{ padding: '20px', paddingTop: '40px', color: 'black', paddingBottom: '80px', width: '100%', boxSizing: 'border-box' }}>
//                         <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
//                             <div style={{ backgroundColor: 'white', borderRadius: '30px', padding: '5px', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
//                                 <button onClick={() => setHistoryView('history')} style={{ padding: '8px 25px', borderRadius: '25px', border: 'none', backgroundColor: historyView === 'history' ? '#3b82f6' : 'transparent', color: historyView === 'history' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>History</button>
//                                 <button onClick={() => setHistoryView('favorites')} style={{ padding: '8px 25px', borderRadius: '25px', border: 'none', backgroundColor: historyView === 'favorites' ? '#3b82f6' : 'transparent', color: historyView === 'favorites' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>Favorites</button>
//                             </div>
//                         </div>
//                         {historyView === 'history' ? (
//                             <>
//                                 <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px black', textAlign: 'center', marginBottom: '15px' }}>Order History</h2>
//                                 {historyItems.map((item) => (
//                                     <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
//                                             <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{item.place}</span>
//                                             <span style={{ color: 'gray', fontSize: '14px' }}>{item.date}</span>
//                                         </div>
//                                         <div style={{ fontSize: '14px', color: '#555', marginBottom: '10px', width: '85%' }}>{item.items}</div>
//                                         <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'green' }}>{item.total}</div>
//                                         <div onClick={() => deleteHistory(item.id)} style={{ position: 'absolute', bottom: '15px', left: '15px', cursor: 'pointer', color: 'red' }}>
//                                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </>
//                         ) : (
//                             <>
//                                 <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px black', textAlign: 'center', marginBottom: '15px' }}>Your Favorites</h2>
//                                 {favoriteItems.map((item) => (
//                                     <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
//                                         <div>
//                                             <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>{item.name}</div>
//                                             <div style={{ color: 'gray', fontSize: '14px' }}>{item.place}</div>
//                                             <div style={{ color: 'green', fontWeight: 'bold', marginTop: '5px' }}>{item.price}</div>
//                                         </div>
//                                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
//                                             <span style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '5px' }}>★ {item.rating}</span>
//                                             <div onClick={() => removeFavorite(item.id)} style={{ cursor: 'pointer' }}>
//                                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </>
//                         )}
//                     </div>
//                 );
//             case 'profile':
//                 return (
//                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
//                         <div style={{ width: '100px', height: '100px', backgroundColor: 'white', borderRadius: '50%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '30px' }}>
//                             {auth.currentUser?.displayName?.charAt(0) || 'U'}
//                         </div>
//                         <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{auth.currentUser?.displayName || 'User'}</h2>
//                         <p style={{ fontSize: '16px', marginBottom: '20px', opacity: 0.8 }}>{auth.currentUser?.email}</p>

//                         <button onClick={openEditProfile} style={{ padding: '10px 30px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
//                             Edit Profile
//                         </button>

//                         <button onClick={onLogout} style={{ padding: '12px 40px', fontSize: '18px', fontWeight: 'bold', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
//                             Logout
//                         </button>
//                     </div>
//                 );
//             default: return null;
//         }
//     };

//     const NavIcon = ({ name, label, path }) => (
//         <div onClick={() => setActiveTab(name)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeTab === name ? '#3b82f6' : 'gray', height: '100%' }}>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
//             <span style={{ fontSize: '11px', marginTop: '4px' }}>{label}</span>
//         </div>
//     );

//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             <div style={containerStyle}>
//                 <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)', zIndex: 2 }}></div>

//                 {/* Content Area */}
//                 <div style={{ flex: 1, overflowY: 'auto', zIndex: 3, position: 'relative', scrollbarWidth: 'none' }}>
//                     {renderContent()}
//                 </div>

//                 {/* Bottom Nav */}
//                 <div style={{ height: '65px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 10, borderTop: '1px solid #ddd' }}>
//                     <NavIcon name="home" label="Home" path={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>} />
//                     <NavIcon name="chat" label="Chat" path={<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>} />
//                     <NavIcon name="history" label="History" path={<><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>} />
//                     <NavIcon name="profile" label="Profile" path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>} />
//                 </div>

//                 {/* --- EDIT PROFILE POPUP --- */}
//                 {showEditProfile && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px' }}>
//                             <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>Edit Profile</h3>

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
//                             <input
//                                 type="text"
//                                 value={editData.fullname}
//                                 onChange={(e) => setEditData({ ...editData, fullname: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '15px' }}
//                             />

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone No (Database)</label>
//                             <input
//                                 type="tel"
//                                 placeholder="Update Phone..."
//                                 value={editData.phone}
//                                 onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '15px' }}
//                             />

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password</label>
//                             <input
//                                 type="password"
//                                 placeholder="Leave empty to keep current"
//                                 value={editData.password}
//                                 onChange={(e) => setEditData({ ...editData, password: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '20px' }}
//                             />

//                             <button onClick={handleSaveProfile} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Save Changes</button>
//                             <button onClick={() => setShowEditProfile(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#f3f4f6', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* --- CAMERA/UPLOAD POPUP --- */}
//                 {showScanOptions && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowScanOptions(false)}>
//                         <div style={{ width: '100%', backgroundColor: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', paddingBottom: '40px', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
//                             <div style={{ width: '40px', height: '5px', backgroundColor: '#ddd', borderRadius: '10px', margin: '0 auto 20px auto' }}></div>
//                             <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>Upload Menu</h3>
//                             <div onClick={startCamera} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
//                                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div>
//                                 <span style={{ fontSize: '18px' }}>Take Photo</span>
//                             </div>
//                             <label style={{ display: 'flex', alignItems: 'center', padding: '15px', cursor: 'pointer' }}>
//                                 <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
//                                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
//                                 <span style={{ fontSize: '18px' }}>Upload from Gallery</span>
//                             </label>
//                             <button onClick={() => setShowScanOptions(false)} style={{ width: '100%', padding: '15px', marginTop: '10px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* --- FULL SCREEN CAMERA OVERLAY --- */}
//                 {isCameraOpen && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
//                         <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
//                         <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
//                         <div style={{ position: 'absolute', bottom: '30px', display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
//                             <button onClick={stopCamera} style={{ color: 'white', background: 'none', border: 'none', fontSize: '18px' }}>Cancel</button>
//                             <button onClick={takePhoto} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'white', border: '5px solid #ccc' }}></button>
//                             <div style={{ width: '50px' }}></div>
//                         </div>
//                     </div>
//                 )}

//             </div>
//         </div>
//     );
// }

// // ==========================================
// // 5. MAIN APP CONTROLLER
// // ==========================================
// export default function App() {
//     const [currentScreen, setCurrentScreen] = useState('splash');

//     return (
//         <>
//             {currentScreen === 'splash' && <SplashScreen onGetStarted={() => setCurrentScreen('login')} />}
//             {currentScreen === 'login' && <LoginScreen onBack={() => setCurrentScreen('splash')} onSignupClick={() => setCurrentScreen('signup')} onLoginSuccess={() => setCurrentScreen('dashboard')} />}
//             {currentScreen === 'signup' && <SignupScreen onBack={() => setCurrentScreen('splash')} onSignupSuccess={() => setCurrentScreen('dashboard')} />}
//             {currentScreen === 'dashboard' && <Dashboard onLogout={() => setCurrentScreen('splash')} />}
//         </>
//     );
// }

// import React, { useState, useRef, useEffect } from 'react';
// import foodBackground from './assets/food.png';

// // --- FIREBASE IMPORTS ---
// import {
//     signInWithEmailAndPassword,
//     signInWithPhoneNumber,
//     EmailAuthProvider,
//     linkWithCredential,
//     updateProfile,
//     updatePassword, // <--- NEW: To change password
//     RecaptchaVerifier
// } from 'firebase/auth';
// import { doc, setDoc, updateDoc } from 'firebase/firestore'; // <--- NEW: updateDoc
// import { auth, db } from './firebase';

// // --- BACK BUTTON COMPONENT ---
// const BackButton = ({ onClick }) => (
//     <div
//         onClick={onClick}
//         style={{
//             position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px',
//             backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
//             justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 50
//         }}
//     >
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M15 18l-6-6 6-6" />
//         </svg>
//     </div>
// );

// // --- CONTAINER STYLE ---
// const containerStyle = {
//     position: 'relative',
//     width: '100%',
//     maxWidth: '480px',
//     height: '100vh',
//     overflow: 'hidden',
//     boxShadow: '0 0 20px rgba(0,0,0,0.5)',
//     backgroundColor: 'white',
//     display: 'flex',
//     flexDirection: 'column'
// };

// // ==========================================
// // 1. SPLASH SCREEN (ANIMATED + SAFE LAYOUT)
// // ==========================================
// function SplashScreen({ onGetStarted }) {
//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             {/* CSS Animations Restored */}
//             <style>
//                 {`
//                     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//                     @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//                     @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }
//                     .animate-fade { animation: fadeIn 1.5s ease-out forwards; }
//                     .animate-slide-1 { animation: slideUp 0.8s ease-out 0.2s forwards; opacity: 0; }
//                     .animate-slide-2 { animation: slideUp 0.8s ease-out 0.4s forwards; opacity: 0; }
//                     .animate-slide-3 { animation: slideUp 0.8s ease-out 0.6s forwards; opacity: 0; }
//                     .btn-pulse { animation: pulse 2s infinite; }
//                 `}
//             </style>

//             <div style={{
//                 position: 'relative',
//                 width: '100%',
//                 maxWidth: '480px',
//                 height: '100vh',
//                 // SCROLLING ENABLED: Ensures animations don't push button off-screen
//                 overflowY: 'auto',
//                 overflowX: 'hidden',
//                 boxShadow: '0 0 20px rgba(0,0,0,0.5)',
//                 backgroundColor: 'white',
//                 display: 'flex',
//                 flexDirection: 'column',
//                 scrollbarWidth: 'none' // Hide scrollbar
//             }}>
//                 {/* 1. Background Image */}
//                 <img
//                     src={foodBackground}
//                     alt="Food background"
//                     style={{
//                         position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//                         objectFit: 'cover', zIndex: 1,
//                         filter: 'brightness(0.8)'
//                     }}
//                 />

//                 {/* 2. Gradient Overlay */}
//                 <div style={{
//                     position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//                     background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
//                     zIndex: 2
//                 }}></div>

//                 {/* 3. Content Layer */}
//                 <div style={{
//                     position: 'relative',
//                     width: '100%',
//                     minHeight: '100vh',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     color: 'white',
//                     textAlign: 'center',
//                     zIndex: 3,
//                     padding: '20px',
//                     boxSizing: 'border-box'
//                 }}>

//                     {/* Logo / Icon (Fade In) */}
//                     <div className="animate-fade" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                         <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.4)' }}>
//                             <span style={{ fontSize: '40px' }}>🍽️</span>
//                         </div>
//                     </div>

//                     {/* Title (Slide Up 1) */}
//                     <div className="animate-slide-1">
//                         <h1 style={{
//                             fontSize: '42px', fontWeight: '800', marginBottom: '5px',
//                             letterSpacing: '1px', textShadow: '0 4px 10px rgba(0,0,0,0.5)',
//                             fontFamily: 'sans-serif'
//                         }}>
//                             Menu<span style={{ color: '#fbbf24' }}>Vision</span>
//                         </h1>
//                         <p style={{ fontSize: '16px', fontWeight: '300', opacity: 0.9, letterSpacing: '2px', marginBottom: '30px', textTransform: 'uppercase' }}>
//                             SMART MENUS, SMART CHOICES
//                         </p>
//                     </div>

//                     {/* Description (Slide Up 2) */}
//                     <p className="animate-slide-2" style={{
//                         fontSize: '16px', lineHeight: '1.6', marginBottom: '40px',
//                         padding: '0 10px', color: '#e5e7eb', maxWidth: '350px'
//                     }}>
//                         Discover delicious flavors and explore personalized dining experiences like never before.
//                     </p>

//                     {/* Button (Slide Up 3 + Pulse) */}
//                     <button
//                         onClick={onGetStarted}
//                         className="btn-pulse"
//                         style={{
//                             padding: '18px 60px',
//                             fontSize: '18px',
//                             fontWeight: 'bold',
//                             border: 'none',
//                             borderRadius: '50px',
//                             backgroundColor: '#fbbf24',
//                             color: 'black',
//                             cursor: 'pointer',
//                             boxShadow: '0 10px 25px rgba(251, 191, 36, 0.4)',
//                             letterSpacing: '0.5px',
//                             marginBottom: '20px'
//                         }}
//                     >
//                         Get Started
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }
// // ==========================================
// // 2. LOGIN SCREEN
// // ==========================================
// function LoginScreen({ onBack, onSignupClick, onLoginSuccess }) {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');

//     const handleLogin = async () => {
//         if (!email.trim() || !password.trim()) { setError('All fields are required.'); return; }
//         setError('');
//         try {
//             await signInWithEmailAndPassword(auth, email, password);
//             alert('Login Successful!');
//             onLoginSuccess();
//         } catch (err) {
//             console.error(err);
//             if (err.code === 'auth/user-not-found') setError('No account found. Please Sign Up first.');
//             else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
//             else if (err.code === 'auth/invalid-credential') setError('No account found or incorrect details.');
//             else setError('Login failed.');
//         }
//     };

//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             <div style={containerStyle}>
//                 <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
//                 <BackButton onClick={onBack} />

//                 <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
//                     <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
//                         <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
//                             <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Email:</label>
//                             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
//                         </div>
//                         <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: error ? '20px' : '60px' }}>
//                             <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Password:</label>
//                             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
//                         </div>
//                         {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
//                         <button onClick={handleLogin} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '22px', fontWeight: '500', cursor: 'pointer', marginBottom: '20px' }}>Login</button>
//                         <div style={{ fontSize: '16px', color: 'black' }}>Dont have account? <span onClick={onSignupClick} style={{ color: '#3b82f6', cursor: 'pointer' }}>Signup</span></div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ==========================================
// // 3. SIGNUP SCREEN (POPUP VERIFICATION)
// // ==========================================
// function SignupScreen({ onBack, onSignupSuccess }) {
//     const [formData, setFormData] = useState({ email: '', fullname: '', phone: '', password: '', confirmPassword: '' });
//     const [otp, setOtp] = useState('');
//     const [error, setError] = useState('');
//     const [showOtpPopup, setShowOtpPopup] = useState(false);
//     const [loading, setLoading] = useState(false);

//     const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//     // --- STEP 1: VALIDATE & OPEN POPUP ---
//     const handleSignupClick = async () => {
//         const { email, fullname, phone, password, confirmPassword } = formData;

//         if (!email || !fullname || !phone || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
//         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address.'); return; }
//         if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) { setError('Phone number must be exactly 10 digits.'); return; }
//         if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
//         if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

//         setLoading(true);
//         setError('');

//         try {
//             if (!window.recaptchaVerifier) {
//                 window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
//                     'size': 'invisible',
//                     'callback': (response) => { }
//                 });
//             }

//             const formattedPhoneNumber = `+977${phone}`;
//             const appVerifier = window.recaptchaVerifier;
//             const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
//             window.confirmationResult = confirmationResult;

//             setLoading(false);
//             setShowOtpPopup(true);
//             alert(`OTP sent to ${formattedPhoneNumber}`);

//         } catch (err) {
//             console.error(err);
//             setLoading(false);
//             if (err.code === 'auth/invalid-phone-number') setError('Invalid phone format. Add country code (e.g., +91).');
//             else setError(err.message);
//         }
//     };

//     // --- STEP 2: VERIFY OTP ---
//     const handleVerifyOtp = async () => {
//         if (otp.length !== 6) { alert('Please enter 6-digit OTP'); return; }
//         setLoading(true);

//         try {
//             const phoneCredential = await window.confirmationResult.confirm(otp);
//             const user = phoneCredential.user;

//             const credential = EmailAuthProvider.credential(formData.email, formData.password);
//             await linkWithCredential(user, credential);
//             await updateProfile(user, { displayName: formData.fullname });

//             await setDoc(doc(db, "users", user.uid), {
//                 uid: user.uid,
//                 fullname: formData.fullname,
//                 email: formData.email,
//                 phone: formData.phone,
//                 createdAt: new Date()
//             });

//             alert('Account Verified & Created!');
//             onSignupSuccess();

//         } catch (err) {
//             console.error(err);
//             setLoading(false);
//             alert('Verification Failed: ' + err.message);
//         }
//     };

//     const rowStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' };
//     const labelStyle = { fontSize: '18px', color: 'black', whiteSpace: 'nowrap' };
//     const inputStyle = { width: '55%', height: '30px', border: '1px solid #555', paddingLeft: '5px' };

//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             <div style={containerStyle}>
//                 <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
//                 <BackButton onClick={onBack} />

//                 <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
//                     <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
//                         <div style={rowStyle}><label style={labelStyle}>Email:</label><input name="email" onChange={handleChange} type="email" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Full name:</label><input name="fullname" onChange={handleChange} type="text" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Phone no:</label><input name="phone" placeholder="98XXXXXXXX" onChange={handleChange} type="tel" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Password:</label><input name="password" onChange={handleChange} type="password" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Confirm:</label><input name="confirmPassword" onChange={handleChange} type="password" style={{ ...inputStyle, width: '35%' }} /></div>

//                         {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
//                         <button onClick={handleSignupClick} disabled={loading} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '20px', fontWeight: '500', cursor: 'pointer' }}>
//                             {loading ? 'Processing...' : 'Sign Up'}
//                         </button>
//                     </div>
//                 </div>

//                 {showOtpPopup && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px', textAlign: 'center' }}>
//                             <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold' }}>Verification</h3>
//                             <p style={{ marginBottom: '20px' }}>Enter the OTP sent to <br /><b>+977 {formData.phone}</b></p>
//                             <input type="number" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: '100%', height: '45px', fontSize: '22px', textAlign: 'center', letterSpacing: '5px', marginBottom: '20px', border: '2px solid #ccc', borderRadius: '5px' }} />
//                             <button onClick={handleVerifyOtp} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Verify Code</button>
//                             <button onClick={() => setShowOtpPopup(false)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}
//                 <div id="recaptcha-container"></div>
//             </div>
//         </div>
//     );
// }

// // ==========================================
// // 4. DASHBOARD SCREEN
// // ==========================================
// function Dashboard({ onLogout }) {
//     const [activeTab, setActiveTab] = useState('home');
//     const [showScanOptions, setShowScanOptions] = useState(false);
//     const [capturedImage, setCapturedImage] = useState(null);
//     const [historyView, setHistoryView] = useState('history');

//     // -- Profile Edit State
//     const [showEditProfile, setShowEditProfile] = useState(false);
//     const [editData, setEditData] = useState({ fullname: '', phone: '', password: '' });

//     // -- Camera stream refs
//     const [isCameraOpen, setIsCameraOpen] = useState(false);
//     const videoRef = useRef(null);
//     const canvasRef = useRef(null);

//     // --- DUMMY DATA FOR RECOMMENDED DISHES (HOME) (Using unique IDs 101-105) ---
//     const recommendedDishes = [
//         { id: 101, name: 'Spicy Ramen', place: 'Hokkaido Ramen', price: 'Rs. 450', img: '🍜', rating: '4.7' },
//         { id: 102, name: 'Butter Chicken', place: 'Tandoori Nights', price: 'Rs. 950', img: '🍛', rating: '4.9' },
//         { id: 103, name: 'Crispy Fried Chicken', place: 'KFC', price: 'Rs. 800', img: '🍗', rating: '4.6' },
//         { id: 104, name: 'Margherita Pizza', place: 'Fire & Ice', price: 'Rs. 1100', img: '🍕', rating: '4.5' },
//         { id: 105, name: 'Mixed Momo Platter', place: 'Momo Magic', price: 'Rs. 600', img: '🥟', rating: '4.8' },
//     ];

//     // --- DUMMY DATA FOR HISTORY ---
//     const [historyItems, setHistoryItems] = useState([
//         { id: 1, place: 'Burger House', date: '20 Dec 2025', items: '2x Chicken Burger, 1x Coke', total: 'Rs. 550' },
//         { id: 2, place: 'Pizza Hut', date: '15 Dec 2025', items: '1x Pepperoni Pizza (L)', total: 'Rs. 1200' },
//         { id: 3, place: 'Momo Magic', date: '10 Dec 2025', items: '2x Steam Momo, 1x C-Momo', total: 'Rs. 400' },
//         { id: 4, place: 'Bakery Cafe', date: '05 Dec 2025', items: '1x Sandwich, 1x Coffee', total: 'Rs. 350' },
//         { id: 5, place: 'KFC', date: '01 Dec 2025', items: '1x Bucket Meal', total: 'Rs. 1500' },
//         { id: 6, place: 'Bajeko Sekuwa', date: '28 Nov 2025', items: '1x Mutton Sekuwa Set', total: 'Rs. 850' },
//     ]);

//     // --- DUMMY DATA FOR FAVORITES ---
//     const [favoriteItems, setFavoriteItems] = useState([
//         { id: 1, name: 'Chicken Momo', place: 'Momo Magic', price: 'Rs. 200', rating: '5.0' },
//         { id: 2, name: 'Pepperoni Pizza', place: 'Pizza Hut', price: 'Rs. 1200', rating: '4.8' },
//         { id: 3, name: 'Cheese Burger', place: 'Burger House', price: 'Rs. 350', rating: '4.5' },
//     ]);

//     // --- HELPER FUNCTIONS ---
//     const deleteHistory = (id) => setHistoryItems(historyItems.filter(item => item.id !== id));

//     // Remove from Favorites (Heart click in Favorites tab)
//     const removeFavorite = (id) => setFavoriteItems(favoriteItems.filter(item => item.id !== id));

//     // Toggle Favorite (Heart click in Recommended list)
//     const toggleRecommendedLike = (dish) => {
//         // Check if item is already in favorites
//         const isFav = favoriteItems.some(item => item.id === dish.id);

//         if (isFav) {
//             // Remove it
//             setFavoriteItems(favoriteItems.filter(item => item.id !== dish.id));
//         } else {
//             // Add it
//             setFavoriteItems([...favoriteItems, {
//                 id: dish.id,
//                 name: dish.name,
//                 place: dish.place,
//                 price: dish.price,
//                 rating: dish.rating
//             }]);
//         }
//     };

//     const openEditProfile = () => {
//         setEditData({
//             fullname: auth.currentUser?.displayName || '',
//             phone: '', // Placeholder as we don't fetch from DB here for simplicity
//             password: ''
//         });
//         setShowEditProfile(true);
//     };

//     const handleSaveProfile = async () => {
//         try {
//             const user = auth.currentUser;
//             if (editData.fullname) {
//                 await updateProfile(user, { displayName: editData.fullname });
//             }
//             if (editData.password && editData.password.length >= 6) {
//                 await updatePassword(user, editData.password);
//             }
//             // Update Firestore with new data
//             if (editData.fullname || editData.phone) {
//                 await updateDoc(doc(db, 'users', user.uid), {
//                     fullname: editData.fullname,
//                     phone: editData.phone // Updating DB record only (Auth phone update requires OTP)
//                 });
//             }
//             alert("Profile Updated Successfully!");
//             setShowEditProfile(false);
//         } catch (error) {
//             console.error(error);
//             alert("Update Failed: " + error.message);
//         }
//     };

//     const startCamera = async () => {
//         setIsCameraOpen(true);
//         setShowScanOptions(false);
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
//             if (videoRef.current) { videoRef.current.srcObject = stream; }
//         } catch (err) { alert("Error opening camera: " + err.message); setIsCameraOpen(false); }
//     };

//     const takePhoto = () => {
//         const video = videoRef.current;
//         const canvas = canvasRef.current;
//         if (video && canvas) {
//             canvas.width = video.videoWidth;
//             canvas.height = video.videoHeight;
//             const context = canvas.getContext('2d');
//             context.drawImage(video, 0, 0, canvas.width, canvas.height);
//             setCapturedImage(canvas.toDataURL('image/png'));
//             stopCamera();
//         }
//     };

//     const stopCamera = () => {
//         if (videoRef.current && videoRef.current.srcObject) {
//             videoRef.current.srcObject.getTracks().forEach(track => track.stop());
//             videoRef.current.srcObject = null;
//         }
//         setIsCameraOpen(false);
//     };

//     const handleFileChange = (event) => {
//         const file = event.target.files[0];
//         if (file) { setCapturedImage(URL.createObjectURL(file)); setShowScanOptions(false); }
//     };

//     const renderContent = () => {
//         switch (activeTab) {
//             case 'home':
//                 return (
//                     <div style={{ padding: '20px', paddingTop: '40px', color: 'black', width: '100%', boxSizing: 'border-box' }}>
//                         <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', textShadow: '2px 2px black', color: 'white', textAlign: 'center' }}>Dashboard</h1>
//                         <p style={{ fontSize: '20px', marginBottom: '30px', textAlign: 'center', color: 'white' }}>Welcome to Menu Vision!</p>

//                         <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '15px' }}>Recommended Dishes</h3>

//                         <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//                             {recommendedDishes.map(dish => {
//                                 // Is this dish already liked?
//                                 const isLiked = favoriteItems.some(fav => fav.id === dish.id);

//                                 return (
//                                     <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '15px', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
//                                         <div style={{ display: 'flex', alignItems: 'center' }}>
//                                             <div style={{ fontSize: '40px', marginRight: '15px' }}>{dish.img}</div>
//                                             <div>
//                                                 <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{dish.name}</div>
//                                                 <div style={{ fontSize: '14px', color: 'gray' }}>{dish.place}</div>
//                                                 <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '16px', marginTop: '4px' }}>{dish.price}</div>
//                                             </div>
//                                         </div>

//                                         {/* HEART ICON BUTTON */}
//                                         <div onClick={() => toggleRecommendedLike(dish)} style={{ cursor: 'pointer', padding: '10px' }}>
//                                             <svg width="28" height="28" viewBox="0 0 24 24"
//                                                 fill={isLiked ? "red" : "none"} // Filled if liked
//                                                 stroke={isLiked ? "red" : "#ccc"} // Red stroke if liked, gray if not
//                                                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
//                                             >
//                                                 <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
//                                             </svg>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 );
//             case 'scan':
//                 return (
//                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
//                         <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', textShadow: '1px 1px black' }}>Scan Menu</h2>
//                         {capturedImage ? (
//                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                                 <img src={capturedImage} alt="Captured" style={{ width: '250px', height: '350px', objectFit: 'contain', borderRadius: '10px', border: '3px solid white', marginBottom: '20px', backgroundColor: 'black' }} />
//                                 <div style={{ display: 'flex', gap: '10px' }}>
//                                     <button onClick={() => setCapturedImage(null)} style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Retake</button>
//                                     <button onClick={() => alert("Uploading...")} style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Confirm</button>
//                                 </div>
//                             </div>
//                         ) : (
//                             <button onClick={() => setShowScanOptions(true)} style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', color: 'black', border: '5px solid #3b82f6', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
//                                 <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
//                                     <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>
//                                 </svg>
//                                 Tap to Scan
//                             </button>
//                         )}
//                     </div>
//                 );
//             case 'history':
//                 return (
//                     <div style={{ padding: '20px', paddingTop: '40px', color: 'black', paddingBottom: '80px', width: '100%', boxSizing: 'border-box' }}>
//                         <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
//                             <div style={{ backgroundColor: 'white', borderRadius: '30px', padding: '5px', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
//                                 <button onClick={() => setHistoryView('history')} style={{ padding: '8px 25px', borderRadius: '25px', border: 'none', backgroundColor: historyView === 'history' ? '#3b82f6' : 'transparent', color: historyView === 'history' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>History</button>
//                                 <button onClick={() => setHistoryView('favorites')} style={{ padding: '8px 25px', borderRadius: '25px', border: 'none', backgroundColor: historyView === 'favorites' ? '#3b82f6' : 'transparent', color: historyView === 'favorites' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>Favorites</button>
//                             </div>
//                         </div>
//                         {historyView === 'history' ? (
//                             <>
//                                 <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px black', textAlign: 'center', marginBottom: '15px' }}>Order History</h2>
//                                 {historyItems.map((item) => (
//                                     <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
//                                             <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{item.place}</span>
//                                             <span style={{ color: 'gray', fontSize: '14px' }}>{item.date}</span>
//                                         </div>
//                                         <div style={{ fontSize: '14px', color: '#555', marginBottom: '10px', width: '85%' }}>{item.items}</div>
//                                         <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'green' }}>{item.total}</div>
//                                         <div onClick={() => deleteHistory(item.id)} style={{ position: 'absolute', bottom: '15px', left: '15px', cursor: 'pointer', color: 'red' }}>
//                                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </>
//                         ) : (
//                             <>
//                                 <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px black', textAlign: 'center', marginBottom: '15px' }}>Your Favorites</h2>
//                                 {favoriteItems.map((item) => (
//                                     <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
//                                         <div>
//                                             <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>{item.name}</div>
//                                             <div style={{ color: 'gray', fontSize: '14px' }}>{item.place}</div>
//                                             <div style={{ color: 'green', fontWeight: 'bold', marginTop: '5px' }}>{item.price}</div>
//                                         </div>
//                                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
//                                             <span style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '5px' }}>★ {item.rating}</span>
//                                             <div onClick={() => removeFavorite(item.id)} style={{ cursor: 'pointer' }}>
//                                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </>
//                         )}
//                     </div>
//                 );
//             case 'profile':
//                 return (
//                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
//                         <div style={{ width: '100px', height: '100px', backgroundColor: 'white', borderRadius: '50%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '30px' }}>
//                             {auth.currentUser?.displayName?.charAt(0) || 'U'}
//                         </div>
//                         <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{auth.currentUser?.displayName || 'User'}</h2>
//                         <p style={{ fontSize: '16px', marginBottom: '20px', opacity: 0.8 }}>{auth.currentUser?.email}</p>

//                         <button onClick={openEditProfile} style={{ padding: '10px 30px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
//                             Edit Profile
//                         </button>

//                         <button onClick={onLogout} style={{ padding: '12px 40px', fontSize: '18px', fontWeight: 'bold', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
//                             Logout
//                         </button>
//                     </div>
//                 );
//             default: return null;
//         }
//     };

//     const NavIcon = ({ name, label, path }) => (
//         <div onClick={() => setActiveTab(name)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeTab === name ? '#3b82f6' : 'gray', height: '100%' }}>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
//             <span style={{ fontSize: '11px', marginTop: '4px' }}>{label}</span>
//         </div>
//     );

//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             <div style={containerStyle}>
//                 <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)', zIndex: 2 }}></div>

//                 {/* Content Area */}
//                 <div style={{ flex: 1, overflowY: 'auto', zIndex: 3, position: 'relative', scrollbarWidth: 'none' }}>
//                     {renderContent()}
//                 </div>

//                 {/* Bottom Nav */}
//                 <div style={{ height: '65px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 10, borderTop: '1px solid #ddd' }}>
//                     <NavIcon name="home" label="Home" path={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>} />
//                     <NavIcon name="scan" label="Scan" path={<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>} />
//                     <NavIcon name="history" label="History" path={<><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>} />
//                     <NavIcon name="profile" label="Profile" path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>} />
//                 </div>

//                 {/* --- EDIT PROFILE POPUP --- */}
//                 {showEditProfile && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px' }}>
//                             <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>Edit Profile</h3>

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
//                             <input
//                                 type="text"
//                                 value={editData.fullname}
//                                 onChange={(e) => setEditData({ ...editData, fullname: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '15px' }}
//                             />

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone No (Database)</label>
//                             <input
//                                 type="tel"
//                                 placeholder="Update Phone..."
//                                 value={editData.phone}
//                                 onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '15px' }}
//                             />

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password</label>
//                             <input
//                                 type="password"
//                                 placeholder="Leave empty to keep current"
//                                 value={editData.password}
//                                 onChange={(e) => setEditData({ ...editData, password: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '20px' }}
//                             />

//                             <button onClick={handleSaveProfile} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Save Changes</button>
//                             <button onClick={() => setShowEditProfile(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#f3f4f6', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* --- CAMERA/UPLOAD POPUP --- */}
//                 {showScanOptions && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowScanOptions(false)}>
//                         <div style={{ width: '100%', backgroundColor: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', paddingBottom: '40px', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
//                             <div style={{ width: '40px', height: '5px', backgroundColor: '#ddd', borderRadius: '10px', margin: '0 auto 20px auto' }}></div>
//                             <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>Upload Menu</h3>
//                             <div onClick={startCamera} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
//                                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div>
//                                 <span style={{ fontSize: '18px' }}>Take Photo</span>
//                             </div>
//                             <label style={{ display: 'flex', alignItems: 'center', padding: '15px', cursor: 'pointer' }}>
//                                 <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
//                                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
//                                 <span style={{ fontSize: '18px' }}>Upload from Gallery</span>
//                             </label>
//                             <button onClick={() => setShowScanOptions(false)} style={{ width: '100%', padding: '15px', marginTop: '10px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* --- FULL SCREEN CAMERA OVERLAY --- */}
//                 {isCameraOpen && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
//                         <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
//                         <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
//                         <div style={{ position: 'absolute', bottom: '30px', display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
//                             <button onClick={stopCamera} style={{ color: 'white', background: 'none', border: 'none', fontSize: '18px' }}>Cancel</button>
//                             <button onClick={takePhoto} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'white', border: '5px solid #ccc' }}></button>
//                             <div style={{ width: '50px' }}></div>
//                         </div>
//                     </div>
//                 )}

//             </div>
//         </div>
//     );
// }

// // ==========================================
// // 5. MAIN APP CONTROLLER
// // ==========================================
// export default function App() {
//     const [currentScreen, setCurrentScreen] = useState('splash');

//     return (
//         <>
//             {currentScreen === 'splash' && <SplashScreen onGetStarted={() => setCurrentScreen('login')} />}
//             {currentScreen === 'login' && <LoginScreen onBack={() => setCurrentScreen('splash')} onSignupClick={() => setCurrentScreen('signup')} onLoginSuccess={() => setCurrentScreen('dashboard')} />}
//             {currentScreen === 'signup' && <SignupScreen onBack={() => setCurrentScreen('splash')} onSignupSuccess={() => setCurrentScreen('dashboard')} />}
//             {currentScreen === 'dashboard' && <Dashboard onLogout={() => setCurrentScreen('splash')} />}
//         </>
//     );
// }
// import React, { useState, useRef, useEffect } from 'react';
// import foodBackground from './assets/food.png';

// // --- FIREBASE IMPORTS ---
// import {
//     signInWithEmailAndPassword,
//     signInWithPhoneNumber,
//     EmailAuthProvider,
//     linkWithCredential,
//     updateProfile,
//     updatePassword, // <--- NEW: To change password
//     RecaptchaVerifier
// } from 'firebase/auth';
// import { doc, setDoc, updateDoc } from 'firebase/firestore'; // <--- NEW: updateDoc
// import { auth, db } from './firebase';

// // --- BACK BUTTON COMPONENT ---
// const BackButton = ({ onClick }) => (
//     <div
//         onClick={onClick}
//         style={{
//             position: 'absolute', top: '20px', left: '20px', width: '45px', height: '45px',
//             backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
//             justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 50
//         }}
//     >
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M15 18l-6-6 6-6" />
//         </svg>
//     </div>
// );

// // --- CONTAINER STYLE ---
// const containerStyle = {
//     position: 'relative',
//     width: '100%',
//     maxWidth: '480px',
//     height: '100vh',
//     overflow: 'hidden',
//     boxShadow: '0 0 20px rgba(0,0,0,0.5)',
//     backgroundColor: 'white',
//     display: 'flex',
//     flexDirection: 'column'
// };

// // ==========================================
// // 1. SPLASH SCREEN (ANIMATED + SAFE LAYOUT)
// // ==========================================
// function SplashScreen({ onGetStarted }) {
//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             {/* CSS Animations Restored */}
//             <style>
//                 {`
//                     @keyframes fadeIn {
//                         from { opacity: 0; }
//                         to { opacity: 1; }
//                     }
//                     @keyframes slideUp {
//                         from { transform: translateY(30px); opacity: 0; }
//                         to { transform: translateY(0); opacity: 1; }
//                     }
//                     @keyframes pulse {
//                         0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
//                         70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
//                         100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
//                     }
//                     .animate-fade { animation: fadeIn 1.5s ease-out forwards; }
//                     .animate-slide-1 { animation: slideUp 0.8s ease-out 0.2s forwards; opacity: 0; }
//                     .animate-slide-2 { animation: slideUp 0.8s ease-out 0.4s forwards; opacity: 0; }
//                     .animate-slide-3 { animation: slideUp 0.8s ease-out 0.6s forwards; opacity: 0; }
//                     .btn-pulse { animation: pulse 2s infinite; }
//                 `}
//             </style>

//             <div style={{
//                 position: 'relative',
//                 width: '100%',
//                 maxWidth: '480px',
//                 height: '100vh',
//                 // SCROLLING ENABLED: Ensures animations don't push button off-screen
//                 overflowY: 'auto',
//                 overflowX: 'hidden',
//                 boxShadow: '0 0 20px rgba(0,0,0,0.5)',
//                 backgroundColor: 'white',
//                 display: 'flex',
//                 flexDirection: 'column',
//                 scrollbarWidth: 'none' // Hide scrollbar
//             }}>
//                 {/* 1. Background Image */}
//                 <img
//                     src={foodBackground}
//                     alt="Food background"
//                     style={{
//                         position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//                         objectFit: 'cover', zIndex: 1,
//                         filter: 'brightness(0.8)'
//                     }}
//                 />

//                 {/* 2. Gradient Overlay */}
//                 <div style={{
//                     position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
//                     background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
//                     zIndex: 2
//                 }}></div>

//                 {/* 3. Content Layer */}
//                 <div style={{
//                     position: 'relative',
//                     width: '100%',
//                     minHeight: '100vh',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     color: 'white',
//                     textAlign: 'center',
//                     zIndex: 3,
//                     padding: '20px',
//                     boxSizing: 'border-box'
//                 }}>

//                     {/* Logo / Icon (Fade In) */}
//                     <div className="animate-fade" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                         <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.4)' }}>
//                             <span style={{ fontSize: '40px' }}>🍽️</span>
//                         </div>
//                     </div>

//                     {/* Title (Slide Up 1) */}
//                     <div className="animate-slide-1">
//                         <h1 style={{
//                             fontSize: '42px', fontWeight: '800', marginBottom: '5px',
//                             letterSpacing: '1px', textShadow: '0 4px 10px rgba(0,0,0,0.5)',
//                             fontFamily: 'sans-serif'
//                         }}>
//                             Menu<span style={{ color: '#fbbf24' }}>Vision</span>
//                         </h1>
//                         <p style={{ fontSize: '16px', fontWeight: '300', opacity: 0.9, letterSpacing: '2px', marginBottom: '30px', textTransform: 'uppercase' }}>
//                             SMART MENUS, SMART CHOICES
//                         </p>
//                     </div>

//                     {/* Description (Slide Up 2) */}
//                     <p className="animate-slide-2" style={{
//                         fontSize: '16px', lineHeight: '1.6', marginBottom: '40px',
//                         padding: '0 10px', color: '#e5e7eb', maxWidth: '350px'
//                     }}>
//                         Discover delicious flavors and explore personalized dining experiences like never before.
//                     </p>

//                     {/* Button (Slide Up 3 + Pulse) */}
//                     <button
//                         onClick={onGetStarted}
//                         className="btn-pulse"
//                         style={{
//                             padding: '18px 60px',
//                             fontSize: '18px',
//                             fontWeight: 'bold',
//                             border: 'none',
//                             borderRadius: '50px',
//                             backgroundColor: '#fbbf24',
//                             color: 'black',
//                             cursor: 'pointer',
//                             boxShadow: '0 10px 25px rgba(251, 191, 36, 0.4)',
//                             letterSpacing: '0.5px',
//                             marginBottom: '20px'
//                         }}
//                     >
//                         Get Started
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }
// // ==========================================
// // 2. LOGIN SCREEN
// // ==========================================
// function LoginScreen({ onBack, onSignupClick, onLoginSuccess }) {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');

//     const handleLogin = async () => {
//         if (!email.trim() || !password.trim()) { setError('All fields are required.'); return; }
//         setError('');
//         try {
//             await signInWithEmailAndPassword(auth, email, password);
//             alert('Login Successful!');
//             onLoginSuccess();
//         } catch (err) {
//             console.error(err);
//             if (err.code === 'auth/user-not-found') setError('No account found. Please Sign Up first.');
//             else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
//             else if (err.code === 'auth/invalid-credential') setError('No account found or incorrect details.');
//             else setError('Login failed.');
//         }
//     };

//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             <div style={containerStyle}>
//                 <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
//                 <BackButton onClick={onBack} />

//                 <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
//                     <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
//                         <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
//                             <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Email:</label>
//                             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
//                         </div>
//                         <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: error ? '20px' : '60px' }}>
//                             <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Password:</label>
//                             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
//                         </div>
//                         {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
//                         <button onClick={handleLogin} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '22px', fontWeight: '500', cursor: 'pointer', marginBottom: '20px' }}>Login</button>
//                         <div style={{ fontSize: '16px', color: 'black' }}>Dont have account? <span onClick={onSignupClick} style={{ color: '#3b82f6', cursor: 'pointer' }}>Signup</span></div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// // ==========================================
// // 3. SIGNUP SCREEN (POPUP VERIFICATION)
// // ==========================================
// function SignupScreen({ onBack, onSignupSuccess }) {
//     const [formData, setFormData] = useState({ email: '', fullname: '', phone: '', password: '', confirmPassword: '' });
//     const [otp, setOtp] = useState('');
//     const [error, setError] = useState('');
//     const [showOtpPopup, setShowOtpPopup] = useState(false);
//     const [loading, setLoading] = useState(false);

//     const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//     // --- STEP 1: VALIDATE & OPEN POPUP ---
//     const handleSignupClick = async () => {
//         const { email, fullname, phone, password, confirmPassword } = formData;

//         if (!email || !fullname || !phone || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
//         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address.'); return; }
//         if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) { setError('Phone number must be exactly 10 digits.'); return; }
//         if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
//         if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

//         setLoading(true);
//         setError('');

//         try {
//             if (!window.recaptchaVerifier) {
//                 window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
//                     'size': 'invisible',
//                     'callback': (response) => { }
//                 });
//             }

//             const formattedPhoneNumber = `+977${phone}`;
//             const appVerifier = window.recaptchaVerifier;
//             const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
//             window.confirmationResult = confirmationResult;

//             setLoading(false);
//             setShowOtpPopup(true);
//             alert(`OTP sent to ${formattedPhoneNumber}`);

//         } catch (err) {
//             console.error(err);
//             setLoading(false);
//             if (err.code === 'auth/invalid-phone-number') setError('Invalid phone format. Add country code (e.g., +91).');
//             else setError(err.message);
//         }
//     };

//     // --- STEP 2: VERIFY OTP ---
//     const handleVerifyOtp = async () => {
//         if (otp.length !== 6) { alert('Please enter 6-digit OTP'); return; }
//         setLoading(true);

//         try {
//             const phoneCredential = await window.confirmationResult.confirm(otp);
//             const user = phoneCredential.user;

//             const credential = EmailAuthProvider.credential(formData.email, formData.password);
//             await linkWithCredential(user, credential);
//             await updateProfile(user, { displayName: formData.fullname });

//             await setDoc(doc(db, "users", user.uid), {
//                 uid: user.uid,
//                 fullname: formData.fullname,
//                 email: formData.email,
//                 phone: formData.phone,
//                 createdAt: new Date()
//             });

//             alert('Account Verified & Created!');
//             onSignupSuccess();

//         } catch (err) {
//             console.error(err);
//             setLoading(false);
//             alert('Verification Failed: ' + err.message);
//         }
//     };

//     const rowStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' };
//     const labelStyle = { fontSize: '18px', color: 'black', whiteSpace: 'nowrap' };
//     const inputStyle = { width: '55%', height: '30px', border: '1px solid #555', paddingLeft: '5px' };

//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             <div style={containerStyle}>
//                 <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
//                 <BackButton onClick={onBack} />

//                 <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
//                     <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
//                         <div style={rowStyle}><label style={labelStyle}>Email:</label><input name="email" onChange={handleChange} type="email" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Full name:</label><input name="fullname" onChange={handleChange} type="text" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Phone no:</label><input name="phone" placeholder="98XXXXXXXX" onChange={handleChange} type="tel" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Password:</label><input name="password" onChange={handleChange} type="password" style={inputStyle} /></div>
//                         <div style={rowStyle}><label style={labelStyle}>Confirm Password:</label><input name="confirmPassword" onChange={handleChange} type="password" style={{ ...inputStyle, width: '48%' }} /></div>

//                         {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
//                         <button onClick={handleSignupClick} disabled={loading} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '20px', fontWeight: '500', cursor: 'pointer' }}>
//                             {loading ? 'Processing...' : 'Sign Up'}
//                         </button>
//                     </div>
//                 </div>

//                 {showOtpPopup && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px', textAlign: 'center' }}>
//                             <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold' }}>Verification</h3>
//                             <p style={{ marginBottom: '20px' }}>Enter the OTP sent to <br /><b>+977 {formData.phone}</b></p>
//                             <input type="number" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: '100%', height: '45px', fontSize: '22px', textAlign: 'center', letterSpacing: '5px', marginBottom: '20px', border: '2px solid #ccc', borderRadius: '5px' }} />
//                             <button onClick={handleVerifyOtp} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Verify Code</button>
//                             <button onClick={() => setShowOtpPopup(false)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}
//                 <div id="recaptcha-container"></div>
//             </div>
//         </div>
//     );
// }

// // ==========================================
// // 4. DASHBOARD SCREEN
// // ==========================================
// function Dashboard({ onLogout }) {
//     const [activeTab, setActiveTab] = useState('home');
//     const [showScanOptions, setShowScanOptions] = useState(false);
//     const [capturedImage, setCapturedImage] = useState(null);
//     const [historyView, setHistoryView] = useState('history');

//     // -- Profile Edit State
//     const [showEditProfile, setShowEditProfile] = useState(false);
//     const [editData, setEditData] = useState({ fullname: '', phone: '', password: '' });

//     // -- Camera stream refs
//     const [isCameraOpen, setIsCameraOpen] = useState(false);
//     const videoRef = useRef(null);
//     const canvasRef = useRef(null);

//     // --- DUMMY DATA FOR RECOMMENDED DISHES (HOME) ---
//     const recommendedDishes = [
//         { id: 1, name: 'Spicy Ramen', place: 'Hokkaido Ramen', price: 'Rs. 450', img: '🍜' },
//         { id: 2, name: 'Butter Chicken', place: 'Tandoori Nights', price: 'Rs. 950', img: '🍛' },
//         { id: 3, name: 'Crispy Fried Chicken', place: 'KFC', price: 'Rs. 800', img: '🍗' },
//         { id: 4, name: 'Margherita Pizza', place: 'Fire & Ice', price: 'Rs. 1100', img: '🍕' },
//         { id: 5, name: 'Mixed Momo Platter', place: 'Momo Magic', price: 'Rs. 600', img: '🥟' },
//     ];

//     // --- DUMMY DATA FOR HISTORY ---
//     const [historyItems, setHistoryItems] = useState([
//         { id: 1, place: 'Burger House', date: '20 Dec 2025', items: '2x Chicken Burger, 1x Coke', total: 'Rs. 550' },
//         { id: 2, place: 'Pizza Hut', date: '15 Dec 2025', items: '1x Pepperoni Pizza (L)', total: 'Rs. 1200' },
//         { id: 3, place: 'Momo Magic', date: '10 Dec 2025', items: '2x Steam Momo, 1x C-Momo', total: 'Rs. 400' },
//         { id: 4, place: 'Bakery Cafe', date: '05 Dec 2025', items: '1x Sandwich, 1x Coffee', total: 'Rs. 350' },
//         { id: 5, place: 'KFC', date: '01 Dec 2025', items: '1x Bucket Meal', total: 'Rs. 1500' },
//         { id: 6, place: 'Bajeko Sekuwa', date: '28 Nov 2025', items: '1x Mutton Sekuwa Set', total: 'Rs. 850' },
//     ]);

//     // --- DUMMY DATA FOR FAVORITES ---
//     const [favoriteItems, setFavoriteItems] = useState([
//         { id: 1, name: 'Chicken Momo', place: 'Momo Magic', price: 'Rs. 200', rating: '5.0' },
//         { id: 2, name: 'Pepperoni Pizza', place: 'Pizza Hut', price: 'Rs. 1200', rating: '4.8' },
//         { id: 3, name: 'Cheese Burger', place: 'Burger House', price: 'Rs. 350', rating: '4.5' },
//     ]);

//     // --- HELPER FUNCTIONS ---
//     const deleteHistory = (id) => setHistoryItems(historyItems.filter(item => item.id !== id));
//     const removeFavorite = (id) => setFavoriteItems(favoriteItems.filter(item => item.id !== id));

//     const openEditProfile = () => {
//         setEditData({
//             fullname: auth.currentUser?.displayName || '',
//             phone: '', // Placeholder as we don't fetch from DB here for simplicity
//             password: ''
//         });
//         setShowEditProfile(true);
//     };

//     const handleSaveProfile = async () => {
//         try {
//             const user = auth.currentUser;
//             if (editData.fullname) {
//                 await updateProfile(user, { displayName: editData.fullname });
//             }
//             if (editData.password && editData.password.length >= 6) {
//                 await updatePassword(user, editData.password);
//             }
//             // Update Firestore with new data
//             if (editData.fullname || editData.phone) {
//                 await updateDoc(doc(db, 'users', user.uid), {
//                     fullname: editData.fullname,
//                     phone: editData.phone // Updating DB record only (Auth phone update requires OTP)
//                 });
//             }
//             alert("Profile Updated Successfully!");
//             setShowEditProfile(false);
//         } catch (error) {
//             console.error(error);
//             alert("Update Failed: " + error.message);
//         }
//     };

//     const startCamera = async () => {
//         setIsCameraOpen(true);
//         setShowScanOptions(false);
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
//             if (videoRef.current) { videoRef.current.srcObject = stream; }
//         } catch (err) { alert("Error opening camera: " + err.message); setIsCameraOpen(false); }
//     };

//     const takePhoto = () => {
//         const video = videoRef.current;
//         const canvas = canvasRef.current;
//         if (video && canvas) {
//             canvas.width = video.videoWidth;
//             canvas.height = video.videoHeight;
//             const context = canvas.getContext('2d');
//             context.drawImage(video, 0, 0, canvas.width, canvas.height);
//             setCapturedImage(canvas.toDataURL('image/png'));
//             stopCamera();
//         }
//     };

//     const stopCamera = () => {
//         if (videoRef.current && videoRef.current.srcObject) {
//             videoRef.current.srcObject.getTracks().forEach(track => track.stop());
//             videoRef.current.srcObject = null;
//         }
//         setIsCameraOpen(false);
//     };

//     const handleFileChange = (event) => {
//         const file = event.target.files[0];
//         if (file) { setCapturedImage(URL.createObjectURL(file)); setShowScanOptions(false); }
//     };

//     const renderContent = () => {
//         switch (activeTab) {
//             case 'home':
//                 return (
//                     <div style={{ padding: '20px', paddingTop: '40px', color: 'black', width: '100%', boxSizing: 'border-box' }}>
//                         <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', textShadow: '2px 2px black', color: 'white', textAlign: 'center' }}>Dashboard</h1>
//                         <p style={{ fontSize: '20px', marginBottom: '30px', textAlign: 'center', color: 'white' }}>Welcome to Menu Vision!</p>

//                         <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '15px' }}>Recommended Dishes</h3>

//                         <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//                             {recommendedDishes.map(dish => (
//                                 <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '15px', padding: '15px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
//                                     <div style={{ fontSize: '40px', marginRight: '15px' }}>{dish.img}</div>
//                                     <div style={{ flex: 1 }}>
//                                         <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{dish.name}</div>
//                                         <div style={{ fontSize: '14px', color: 'gray' }}>{dish.place}</div>
//                                     </div>
//                                     <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '16px' }}>{dish.price}</div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 );
//             case 'scan':
//                 return (
//                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
//                         <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', textShadow: '1px 1px black' }}>Scan Menu</h2>
//                         {capturedImage ? (
//                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                                 <img src={capturedImage} alt="Captured" style={{ width: '250px', height: '350px', objectFit: 'contain', borderRadius: '10px', border: '3px solid white', marginBottom: '20px', backgroundColor: 'black' }} />
//                                 <div style={{ display: 'flex', gap: '10px' }}>
//                                     <button onClick={() => setCapturedImage(null)} style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Retake</button>
//                                     <button onClick={() => alert("Uploading...")} style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Confirm</button>
//                                 </div>
//                             </div>
//                         ) : (
//                             <button onClick={() => setShowScanOptions(true)} style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', color: 'black', border: '5px solid #3b82f6', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
//                                 <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
//                                     <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>
//                                 </svg>
//                                 Tap to Scan
//                             </button>
//                         )}
//                     </div>
//                 );
//             case 'history':
//                 return (
//                     <div style={{ padding: '20px', paddingTop: '40px', color: 'black', paddingBottom: '80px', width: '100%', boxSizing: 'border-box' }}>
//                         <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
//                             <div style={{ backgroundColor: 'white', borderRadius: '30px', padding: '5px', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
//                                 <button onClick={() => setHistoryView('history')} style={{ padding: '8px 25px', borderRadius: '25px', border: 'none', backgroundColor: historyView === 'history' ? '#3b82f6' : 'transparent', color: historyView === 'history' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>History</button>
//                                 <button onClick={() => setHistoryView('favorites')} style={{ padding: '8px 25px', borderRadius: '25px', border: 'none', backgroundColor: historyView === 'favorites' ? '#3b82f6' : 'transparent', color: historyView === 'favorites' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>Favorites</button>
//                             </div>
//                         </div>
//                         {historyView === 'history' ? (
//                             <>
//                                 <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px black', textAlign: 'center', marginBottom: '15px' }}>Order History</h2>
//                                 {historyItems.map((item) => (
//                                     <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
//                                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
//                                             <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{item.place}</span>
//                                             <span style={{ color: 'gray', fontSize: '14px' }}>{item.date}</span>
//                                         </div>
//                                         <div style={{ fontSize: '14px', color: '#555', marginBottom: '10px', width: '85%' }}>{item.items}</div>
//                                         <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'green' }}>{item.total}</div>
//                                         <div onClick={() => deleteHistory(item.id)} style={{ position: 'absolute', bottom: '15px', left: '15px', cursor: 'pointer', color: 'red' }}>
//                                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </>
//                         ) : (
//                             <>
//                                 <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px black', textAlign: 'center', marginBottom: '15px' }}>Your Favorites</h2>
//                                 {favoriteItems.map((item) => (
//                                     <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
//                                         <div>
//                                             <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>{item.name}</div>
//                                             <div style={{ color: 'gray', fontSize: '14px' }}>{item.place}</div>
//                                             <div style={{ color: 'green', fontWeight: 'bold', marginTop: '5px' }}>{item.price}</div>
//                                         </div>
//                                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
//                                             <span style={{ fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '5px' }}>★ {item.rating}</span>
//                                             <div onClick={() => removeFavorite(item.id)} style={{ cursor: 'pointer' }}>
//                                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </>
//                         )}
//                     </div>
//                 );
//             case 'profile':
//                 return (
//                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
//                         <div style={{ width: '100px', height: '100px', backgroundColor: 'white', borderRadius: '50%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '30px' }}>
//                             {auth.currentUser?.displayName?.charAt(0) || 'U'}
//                         </div>
//                         <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{auth.currentUser?.displayName || 'User'}</h2>
//                         <p style={{ fontSize: '16px', marginBottom: '20px', opacity: 0.8 }}>{auth.currentUser?.email}</p>

//                         <button onClick={openEditProfile} style={{ padding: '10px 30px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
//                             Edit Profile
//                         </button>

//                         <button onClick={onLogout} style={{ padding: '12px 40px', fontSize: '18px', fontWeight: 'bold', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
//                             Logout
//                         </button>
//                     </div>
//                 );
//             default: return null;
//         }
//     };

//     const NavIcon = ({ name, label, path }) => (
//         <div onClick={() => setActiveTab(name)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeTab === name ? '#3b82f6' : 'gray', height: '100%' }}>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
//             <span style={{ fontSize: '11px', marginTop: '4px' }}>{label}</span>
//         </div>
//     );

//     return (
//         <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
//             <div style={containerStyle}>
//                 <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
//                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)', zIndex: 2 }}></div>

//                 {/* Content Area */}
//                 <div style={{ flex: 1, overflowY: 'auto', zIndex: 3, position: 'relative', scrollbarWidth: 'none' }}>
//                     {renderContent()}
//                 </div>

//                 {/* Bottom Nav */}
//                 <div style={{ height: '65px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 10, borderTop: '1px solid #ddd' }}>
//                     <NavIcon name="home" label="Home" path={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>} />
//                     <NavIcon name="scan" label="Scan" path={<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>} />
//                     <NavIcon name="history" label="History" path={<><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>} />
//                     <NavIcon name="profile" label="Profile" path={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>} />
//                 </div>

//                 {/* --- EDIT PROFILE POPUP --- */}
//                 {showEditProfile && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px' }}>
//                             <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>Edit Profile</h3>

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
//                             <input
//                                 type="text"
//                                 value={editData.fullname}
//                                 onChange={(e) => setEditData({ ...editData, fullname: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '15px' }}
//                             />

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone No (Database)</label>
//                             <input
//                                 type="tel"
//                                 placeholder="Update Phone..."
//                                 value={editData.phone}
//                                 onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '15px' }}
//                             />

//                             <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Password</label>
//                             <input
//                                 type="password"
//                                 placeholder="Leave empty to keep current"
//                                 value={editData.password}
//                                 onChange={(e) => setEditData({ ...editData, password: e.target.value })}
//                                 style={{ width: '100%', height: '40px', border: '1px solid #ccc', borderRadius: '5px', paddingLeft: '10px', marginBottom: '20px' }}
//                             />

//                             <button onClick={handleSaveProfile} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Save Changes</button>
//                             <button onClick={() => setShowEditProfile(false)} style={{ width: '100%', padding: '10px', backgroundColor: '#f3f4f6', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* --- CAMERA/UPLOAD POPUP --- */}
//                 {showScanOptions && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowScanOptions(false)}>
//                         <div style={{ width: '100%', backgroundColor: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', paddingBottom: '40px', animation: 'slideUp 0.3s ease-out' }} onClick={(e) => e.stopPropagation()}>
//                             <div style={{ width: '40px', height: '5px', backgroundColor: '#ddd', borderRadius: '10px', margin: '0 auto 20px auto' }}></div>
//                             <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>Upload Menu</h3>
//                             <div onClick={startCamera} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
//                                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div>
//                                 <span style={{ fontSize: '18px' }}>Take Photo</span>
//                             </div>
//                             <label style={{ display: 'flex', alignItems: 'center', padding: '15px', cursor: 'pointer' }}>
//                                 <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
//                                 <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>
//                                 <span style={{ fontSize: '18px' }}>Upload from Gallery</span>
//                             </label>
//                             <button onClick={() => setShowScanOptions(false)} style={{ width: '100%', padding: '15px', marginTop: '10px', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>Cancel</button>
//                         </div>
//                     </div>
//                 )}

//                 {/* --- FULL SCREEN CAMERA OVERLAY --- */}
//                 {isCameraOpen && (
//                     <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
//                         <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
//                         <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
//                         <div style={{ position: 'absolute', bottom: '30px', display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
//                             <button onClick={stopCamera} style={{ color: 'white', background: 'none', border: 'none', fontSize: '18px' }}>Cancel</button>
//                             <button onClick={takePhoto} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'white', border: '5px solid #ccc' }}></button>
//                             <div style={{ width: '50px' }}></div>
//                         </div>
//                     </div>
//                 )}

//             </div>
//         </div>
//     );
// }

// // ==========================================
// // 5. MAIN APP CONTROLLER
// // ==========================================
// export default function App() {
//     const [currentScreen, setCurrentScreen] = useState('splash');

//     return (
//         <>
//             {currentScreen === 'splash' && <SplashScreen onGetStarted={() => setCurrentScreen('login')} />}
//             {currentScreen === 'login' && <LoginScreen onBack={() => setCurrentScreen('splash')} onSignupClick={() => setCurrentScreen('signup')} onLoginSuccess={() => setCurrentScreen('dashboard')} />}
//             {currentScreen === 'signup' && <SignupScreen onBack={() => setCurrentScreen('splash')} onSignupSuccess={() => setCurrentScreen('dashboard')} />}
//             {currentScreen === 'dashboard' && <Dashboard onLogout={() => setCurrentScreen('splash')} />}
//         </>
//     );
// }






