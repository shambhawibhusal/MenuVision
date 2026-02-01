import React, { useState } from 'react';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Dashboard from './screens/Dashboard';

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
