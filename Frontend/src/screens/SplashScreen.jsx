import React from 'react';
import foodBackground from '../assets/food.png';
import { containerStyle } from '../utils/styles';

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
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '80px', color: 'white', textAlign: 'center', zIndex: 3 }}>
                    <div className="animate-fade" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.4)' }}><span style={{ fontSize: '40px' }}>🍽️</span></div>
                    </div>
                    <div className="animate-slide-1">
                        <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '5px', letterSpacing: '1px', textShadow: '0 4px 10px rgba(0,0,0,0.5)', fontFamily: 'sans-serif' }}>Menu<span style={{ color: '#fbbf24' }}>Vision</span></h1>
                        <p style={{ fontSize: '16px', fontWeight: '300', opacity: 0.9, letterSpacing: '2px', marginBottom: '40px', textTransform: 'uppercase' }}>SMART MENUS, SMART CHOICES</p>
                    </div>
                    <p className="animate-slide-2" style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '50px', padding: '0 30px', color: '#e5e7eb', maxWidth: '350px' }}>Discover delicious flavors and explore personalized dining experiences like never before.</p>
                    <button onClick={onGetStarted} className="btn-pulse" style={{ padding: '18px 60px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '50px', backgroundColor: '#fbbf24', color: 'black', cursor: 'pointer', boxShadow: '0 10px 25px rgba(251, 191, 36, 0.4)', transition: 'transform 0.2s', letterSpacing: '0.5px' }}>Get Started</button>
                </div>
            </div>
        </div>
    );
}

export default SplashScreen;
