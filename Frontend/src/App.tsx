import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Dashboard from './screens/Dashboard';
import OnboardingScreen from './screens/OnboardingScreen';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type Screen = 'splash' | 'login' | 'signup' | 'onboarding' | 'dashboard';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
        const saved = sessionStorage.getItem('currentScreen');
        return (saved as Screen) || 'splash';
    });
    const [pendingOnboardingUser, setPendingOnboardingUser] = useState<User | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

    const updateScreen = (screen: Screen) => {
        setCurrentScreen(screen);
        sessionStorage.setItem('currentScreen', screen);
    };

    const checkOnboardingStatus = async (currentUser: User) => {
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const data = userDoc.data();
                return !(data.foodProfile?.onboardingCompleted === true);
            }
            return true;
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            return true;
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser: User | null) => {
            setUser(currentUser);
            
            if (currentUser) {
                const savedScreen = sessionStorage.getItem('currentScreen');
                if (savedScreen === 'dashboard' || savedScreen === 'onboarding') {
                    const shouldOnboard = await checkOnboardingStatus(currentUser);
                    if (shouldOnboard && savedScreen !== 'onboarding') {
                        updateScreen('onboarding');
                    } else if (!shouldOnboard) {
                        updateScreen('dashboard');
                    }
                } else if (isLoggingIn) {
                    const shouldOnboard = await checkOnboardingStatus(currentUser);
                    if (shouldOnboard) {
                        updateScreen('onboarding');
                    } else {
                        updateScreen('dashboard');
                    }
                    setIsLoggingIn(false);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [isLoggingIn]);

    if (loading) return <div>Loading...</div>;

    return (
        <>
            {currentScreen === 'splash' && <SplashScreen onGetStarted={() => updateScreen('login')} />}
            {currentScreen === 'login' && (
                <LoginScreen
                    onBack={() => updateScreen('splash')}
                    onSignupClick={() => updateScreen('signup')}
                    onLoginSuccess={(loggedInUser: User) => {
                        setUser(loggedInUser);
                        setIsLoggingIn(true);
                    }}
                />
            )}
            {currentScreen === 'signup' && (
                <SignupScreen
                    onBack={() => updateScreen('splash')}
                    onSignupSuccess={(loggedInUser: User) => {
                        setUser(loggedInUser);
                        setPendingOnboardingUser(loggedInUser);
                        updateScreen('onboarding');
                    }}
                />
            )}
            {(currentScreen === 'onboarding' && (pendingOnboardingUser || user)) && (
                <OnboardingScreen
                    user={pendingOnboardingUser || user!}
                    onComplete={() => {
                        setPendingOnboardingUser(null);
                        updateScreen('dashboard');
                    }}
                />
            )}
            {currentScreen === 'dashboard' && user && !pendingOnboardingUser && (
                <Dashboard onLogout={() => {
                    sessionStorage.removeItem('currentScreen');
                    auth.signOut();
                }} />
            )}
        </>
    );
}
