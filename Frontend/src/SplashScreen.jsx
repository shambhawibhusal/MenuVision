import React, { useState, useRef } from 'react';
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
// 1. SPLASH SCREEN
// ==========================================
function SplashScreen({ onGetStarted }) {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1, filter: 'brightness(0.8)' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)', zIndex: 2 }}></div>
                <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', zIndex: 3, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.4)' }}><span style={{ fontSize: '40px' }}>🍽️</span></div>
                    <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '5px' }}>Menu<span style={{ color: '#fbbf24' }}>Vision</span></h1>
                    <p style={{ fontSize: '16px', fontWeight: '300', marginBottom: '30px' }}>SMART MENUS, SMART CHOICES</p>
                    <button onClick={onGetStarted} style={{ padding: '18px 60px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '50px', backgroundColor: '#fbbf24', color: 'black', cursor: 'pointer', boxShadow: '0 10px 25px rgba(251, 191, 36, 0.4)', marginBottom: '20px' }}>Get Started</button>
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
            onLoginSuccess();
        } catch (err) {
            setError('Login failed. Please check credentials.');
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
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc' }} />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc' }} />
                        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                        <button onClick={handleLogin} style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: 'white', borderRadius: '5px' }}>Login</button>
                        <p style={{ marginTop: '10px', fontSize: '14px' }}>Don't have an account? <span onClick={onSignupClick} style={{ color: 'blue', cursor: 'pointer' }}>Signup</span></p>
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
    const [showOtpPopup, setShowOtpPopup] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSignupClick = async () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
        }
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, `+977${formData.phone}`, appVerifier);
        window.confirmationResult = confirmationResult;
        setShowOtpPopup(true);
    };

    const handleVerifyOtp = async () => {
        const phoneCredential = await window.confirmationResult.confirm(otp);
        const user = phoneCredential.user;
        const credential = EmailAuthProvider.credential(formData.email, formData.password);
        await linkWithCredential(user, credential);
        await updateProfile(user, { displayName: formData.fullname });
        await setDoc(doc(db, "users", user.uid), { uid: user.uid, ...formData });
        onSignupSuccess();
    };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
                <BackButton onClick={onBack} />
                <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '10px' }}>
                        <input name="email" placeholder="Email" onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
                        <input name="fullname" placeholder="Full Name" onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
                        <input name="phone" placeholder="Phone (10 digits)" onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
                        <input name="password" type="password" placeholder="Password" onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
                        <input name="confirmPassword" type="password" placeholder="Confirm" onChange={handleChange} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
                        <button onClick={handleSignupClick} style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: 'white', borderRadius: '5px' }}>Sign Up</button>
                    </div>
                </div>
                {showOtpPopup && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
                            <h3>Enter OTP</h3>
                            <input type="number" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ padding: '10px', width: '100%', marginBottom: '10px' }} />
                            <button onClick={handleVerifyOtp} style={{ width: '100%', padding: '10px', backgroundColor: 'green', color: 'white' }}>Verify</button>
                        </div>
                    </div>
                )}
                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
}

// ==========================================
// 4. DASHBOARD SCREEN (WITH OCR UPLOAD)
// ==========================================
function Dashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('home');
    const [showScanOptions, setShowScanOptions] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [scannedItems, setScannedItems] = useState([]); // Store OCR Results
    const [selectedDish, setSelectedDish] = useState(null); // Show details popup

    // --- FUNCTION: UPLOAD TO BACKEND FOR OCR ---
    const analyzeMenu = async () => {
        if (!capturedImage) return;
        setAnalyzing(true);

        try {
            // Send captured image (base64) to Node.js Backend
            const response = await fetch('http://localhost:5000/analyze-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: capturedImage })
            });

            const data = await response.json();

            if (data.success) {
                setScannedItems(data.data); // Store the JSON items from Gemini
                setCapturedImage(null); // Clear image view
                setActiveTab('results'); // Switch to results view
            } else {
                alert("Failed to analyze: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Server Error. Make sure backend is running on port 5000.");
        } finally {
            setAnalyzing(false);
        }
    };

    // --- CAMERA/FILE HELPERS ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result); // This is the Base64 string
                setShowScanOptions(false);
            };
            reader.readAsDataURL(file);
        }
    };

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
                                style={{ backgroundColor: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer' }}
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

        if (activeTab === 'home') {
            return (
                <div style={{ padding: '20px', paddingTop: '40px', color: 'black' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Dashboard</h1>

                    {/* SCAN BUTTON */}
                    <div onClick={() => setShowScanOptions(true)} style={{ backgroundColor: '#22c55e', color: 'white', padding: '20px', borderRadius: '15px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Scan Menu</h3>
                            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Upload a photo to see details</p>
                        </div>
                        <div style={{ fontSize: '30px' }}>📸</div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(5px)', zIndex: 2 }}></div>

                <div style={{ flex: 1, overflowY: 'auto', zIndex: 3 }}>
                    {renderContent()}
                </div>

                {/* POPUP: UPLOAD OPTIONS */}
                {showScanOptions && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowScanOptions(false)}>
                        <div style={{ width: '100%', backgroundColor: 'white', padding: '20px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
                            <h3>Upload Menu</h3>
                            <label style={{ display: 'block', padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                Take Photo <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
                            </label>
                            <label style={{ display: 'block', padding: '15px', cursor: 'pointer' }}>
                                Upload from Gallery <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                )}

                {/* POPUP: PREVIEW & ANALYZE */}
                {capturedImage && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'black', zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={capturedImage} alt="Preview" style={{ width: '80%', marginBottom: '20px' }} />
                        {analyzing ? (
                            <div style={{ color: 'white', fontSize: '20px' }}>Processing with AI...</div>
                        ) : (
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <button onClick={() => setCapturedImage(null)} style={{ padding: '10px 20px', background: 'red', color: 'white', border: 'none' }}>Retake</button>
                                <button onClick={analyzeMenu} style={{ padding: '10px 20px', background: 'green', color: 'white', border: 'none' }}>Analyze Menu</button>
                            </div>
                        )}
                    </div>
                )}

                {/* POPUP: DISH DETAILS */}
                {selectedDish && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', width: '85%', borderRadius: '15px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '5px' }}>{selectedDish.name}</h2>
                            <p style={{ color: 'green', fontWeight: 'bold', marginBottom: '15px' }}>{selectedDish.price}</p>

                            <div style={{ marginBottom: '15px' }}>
                                <strong>Description:</strong>
                                <p style={{ fontSize: '14px', color: '#555' }}>{selectedDish.description}</p>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <strong>Ingredients:</strong>
                                <p style={{ fontSize: '14px', color: '#555' }}>{selectedDish.ingredients}</p>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <strong>Calories (Est.):</strong>
                                <p style={{ fontSize: '14px', color: '#555' }}>{selectedDish.calories}</p>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <strong>Type:</strong>
                                <span style={{ padding: '5px 10px', background: selectedDish.type.toLowerCase().includes('non') ? '#fee2e2' : '#dcfce7', color: selectedDish.type.toLowerCase().includes('non') ? 'red' : 'green', borderRadius: '15px', fontSize: '12px' }}>{selectedDish.type}</span>
                            </div>

                            <button onClick={() => setSelectedDish(null)} style={{ width: '100%', padding: '10px', backgroundColor: 'black', color: 'white', border: 'none', borderRadius: '5px' }}>Close</button>
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