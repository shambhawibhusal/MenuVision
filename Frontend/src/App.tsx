import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Dashboard from './screens/Dashboard';
import { User } from 'firebase/auth';

type Screen = 'splash' | 'login' | 'signup' | 'dashboard';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentScreen, setCurrentScreen] = useState<Screen>('splash');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser: User | null) => {
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
                    onLoginSuccess={(loggedInUser: User) => {
                        setUser(loggedInUser);
                        setCurrentScreen('dashboard');
                    }}
                />
            )}
            {currentScreen === 'signup' && (
                <SignupScreen
                    onBack={() => setCurrentScreen('splash')}
                    onSignupSuccess={(loggedInUser: User) => {
                        setUser(loggedInUser);
                        setCurrentScreen('dashboard');
                    }}
                />
            )}
            {currentScreen === 'dashboard' && user && (
                <Dashboard onLogout={() => auth.signOut()} />
            )}
        </>
    );
}
