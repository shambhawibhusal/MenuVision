import React, { useState } from 'react';
import foodBackground from './assets/food.png';

// --- BACK BUTTON COMPONENT ---
// White circle with black arrow to ensure visibility
const BackButton = ({ onClick }) => (
    <div
        onClick={onClick}
        style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '40px',
            height: '40px',
            backgroundColor: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            zIndex: 999 // Very high priority
        }}
    >
        {/* Simple Bold Arrow Icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    </div>
);

// ==========================================
// 1. SPLASH SCREEN (No Back Button)
// ==========================================
function SplashScreen({ onGetStarted }) {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={{ position: 'relative', width: '412px', height: '917px', border: '2px solid black', overflow: 'hidden' }}>
                {/* Background */}
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', zIndex: 2 }}></div>

                {/* Content */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '24px', zIndex: 3 }}>
                    <p style={{ fontSize: '20px', marginBottom: '24px', marginTop: '-100px', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                        Welcome to Menu Vision!
                    </p>
                    <div style={{ border: '2px solid white', borderRadius: '6px', padding: '4px 24px', fontSize: '30px', fontWeight: 'bold', marginBottom: '48px', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                        MenuVision
                    </div>
                    <p style={{ fontSize: '24px', marginBottom: '80px', lineHeight: '1.6', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                        Our journey to discovering delicious flavors and personalized dining experiences starts here.
                    </p>
                    <button
                        onClick={onGetStarted}
                        style={{ padding: '12px 32px', fontSize: '20px', fontWeight: 'bold', border: '2px solid white', borderRadius: '6px', backgroundColor: 'transparent', color: 'white', cursor: 'pointer', textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. LOGIN SCREEN (With Back Button)
// ==========================================
function LoginScreen({ onBack, onSignupClick }) {
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={{ position: 'relative', width: '412px', height: '917px', border: '2px solid black', overflow: 'hidden' }}>
                {/* Layers */}
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>

                {/* Form Container */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: 'white', width: '85%', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Email:</label>
                            <input type="email" style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
                        </div>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '60px' }}>
                            <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Password:</label>
                            <input type="password" style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
                        </div>
                        <button style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '22px', fontWeight: '500', cursor: 'pointer', marginBottom: '20px' }}>
                            Login
                        </button>
                        <div style={{ fontSize: '16px', color: 'black' }}>
                            Dont have account? <span onClick={onSignupClick} style={{ color: '#3b82f6', cursor: 'pointer' }}>Signup</span>
                        </div>
                    </div>
                </div>

                {/* --- BACK BUTTON (Placed LAST to ensure it is ON TOP) --- */}
                <BackButton onClick={onBack} />
            </div>
        </div>
    );
}

// ==========================================
// 3. SIGNUP SCREEN (With Back Button)
// ==========================================
function SignupScreen({ onBack }) {
    const rowStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' };
    const labelStyle = { fontSize: '18px', color: 'black', whiteSpace: 'nowrap' };
    const inputStyle = { width: '55%', height: '30px', border: '1px solid #555', paddingLeft: '5px' };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={{ position: 'relative', width: '412px', height: '917px', border: '2px solid black', overflow: 'hidden' }}>
                {/* Layers */}
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>

                {/* Form Container */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ backgroundColor: 'white', width: '85%', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={rowStyle}><label style={labelStyle}>Email:</label><input type="email" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Full name:</label><input type="text" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Phone no:</label><input type="tel" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Password:</label><input type="password" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Confirm Password:</label><input type="password" style={{ ...inputStyle, width: '35%' }} /></div>

                        <div style={{ height: '20px' }}></div>
                        <button style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '20px', fontWeight: '500', cursor: 'pointer' }}>
                            Sign Up
                        </button>
                    </div>
                </div>

                {/* --- BACK BUTTON (Placed LAST to ensure it is ON TOP) --- */}
                <BackButton onClick={onBack} />
            </div>
        </div>
    );
}

// ==========================================
// 4. MAIN APP
// ==========================================
export default function App() {
    const [currentScreen, setCurrentScreen] = useState('splash');

    return (
        <>
            {currentScreen === 'splash' && (
                <SplashScreen onGetStarted={() => setCurrentScreen('login')} />
            )}

            {currentScreen === 'login' && (
                <LoginScreen
                    onBack={() => setCurrentScreen('splash')}
                    onSignupClick={() => setCurrentScreen('signup')}
                />
            )}

            {currentScreen === 'signup' && (
                <SignupScreen onBack={() => setCurrentScreen('splash')} />
            )}
        </>
    );
}