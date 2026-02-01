import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Dashboard from './screens/Dashboard';

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentScreen, setCurrentScreen] = useState('splash');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser && currentScreen === 'splash') {
                setCurrentScreen('dashboard');
            }
        });
        return () => unsubscribe();
    }, [currentScreen]);

    if (loading) return <div>Loading...</div>;

    return (
        <>
            {currentScreen === 'splash' && <SplashScreen onGetStarted={() => setCurrentScreen('login')} />}
            {currentScreen === 'login' && (
                <LoginScreen
                    onBack={() => setCurrentScreen('splash')}
                    onSignupClick={() => setCurrentScreen('signup')}
                    onLoginSuccess={(loggedInUser) => {
                        setUser(loggedInUser);
                        setCurrentScreen('dashboard'); // go to Dashboard immediately
                    }}
                />
            )}
            {currentScreen === 'signup' && (
                <SignupScreen
                    onBack={() => setCurrentScreen('splash')}
                    onSignupSuccess={(loggedInUser) => {
                        setUser(loggedInUser);
                        setCurrentScreen('dashboard'); // go to Dashboard immediately
                    }}
                />
            )}
            {currentScreen === 'dashboard' && user && (
                <Dashboard onLogout={() => auth.signOut()} />
            )}
        </>
    );
}
