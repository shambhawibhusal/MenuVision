import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';
import Dashboard from './screens/Dashboard';
import OnboardingScreen from './screens/OnboardingScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import { User, applyActionCode } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { isGoogleAuthProcessing } from './utils/googleAuthGuard';
import { notifyVerified, onAuthBroadcast, AUTH_EVENTS } from './utils/broadcast';

type Screen = 'splash' | 'login' | 'signup' | 'verifyEmail' | 'onboarding' | 'dashboard' | 'resetPassword';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
        const saved = sessionStorage.getItem('currentScreen');
        return (saved as Screen) || 'splash';
    });
    const [pendingOnboardingUser, setPendingOnboardingUser] = useState<User | null>(null);
    const [pendingVerifyUser, setPendingVerifyUser] = useState<User | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
    const [resetOobCode, setResetOobCode] = useState<string | null>(null);

    const updateScreen = (screen: Screen) => {
        setCurrentScreen(screen);
        sessionStorage.setItem('currentScreen', screen);
    };

    const goToDashboard = () => {
        sessionStorage.setItem('activeTab', 'home');
        updateScreen('dashboard');
    };

    const checkOnboardingStatus = async (currentUser: User) => {
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const data = userDoc.data();
                return data.foodProfile?.onboardingCompleted === undefined;
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

            if (currentUser && !isGoogleAuthProcessing()) {
                if (!currentUser.emailVerified) {
                    setPendingVerifyUser(currentUser);
                    updateScreen('verifyEmail');
                } else {
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
                            goToDashboard();
                        }
                        setIsLoggingIn(false);
                    } else {
                        const shouldOnboard = await checkOnboardingStatus(currentUser);
                        if (shouldOnboard) {
                            updateScreen('onboarding');
                        } else {
                            updateScreen('dashboard');
                        }
                    }
                }
            } else {
                setPendingVerifyUser(null);
                setPendingOnboardingUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [isLoggingIn]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const oobCode = params.get('oobCode');
        const mode = params.get('mode');
        if (oobCode && mode === 'resetPassword') {
            setResetOobCode(oobCode);
            updateScreen('resetPassword');
            window.history.replaceState({}, '', window.location.pathname);
        }
        if (oobCode && mode === 'verifyEmail') {
            applyActionCode(auth, oobCode)
                .then(async () => {
                    if (auth.currentUser) {
                        await auth.currentUser.reload();
                    }
                    notifyVerified();
                    window.close();
                })
                .catch(console.error)
                .finally(() => {
                    window.history.replaceState({}, '', window.location.pathname);
                });
        }
    }, []);

    useEffect(() => {
        return onAuthBroadcast((event) => {
            if (event === AUTH_EVENTS.VERIFIED && auth.currentUser) {
                auth.currentUser.reload();
            }
        });
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <>
            {currentScreen === 'splash' && <SplashScreen onGetStarted={() => updateScreen('login')} />}
            {currentScreen === 'resetPassword' && resetOobCode && (
                <ResetPasswordScreen
                    oobCode={resetOobCode}
                    onBackToLogin={() => {
                        setResetOobCode(null);
                        updateScreen('login');
                    }}
                />
            )}
            {currentScreen === 'login' && (
                <LoginScreen
                    onBack={() => updateScreen('splash')}
                    onSignupClick={() => updateScreen('signup')}
                    onLoginSuccess={(loggedInUser: User) => {
                        setUser(loggedInUser);
                        setIsLoggingIn(true);
                    }}
                    onVerifyEmail={(loggedInUser: User) => {
                        setUser(loggedInUser);
                        setPendingVerifyUser(loggedInUser);
                        updateScreen('verifyEmail');
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
                    onVerifyEmail={(loggedInUser: User) => {
                        setUser(loggedInUser);
                        setPendingVerifyUser(loggedInUser);
                        updateScreen('verifyEmail');
                    }}
                />
            )}
            {currentScreen === 'verifyEmail' && pendingVerifyUser && (
                <VerifyEmailScreen
                    user={pendingVerifyUser}
                    onVerified={() => {
                        const verifiedUser = pendingVerifyUser;
                        setPendingVerifyUser(null);
                        setPendingOnboardingUser(verifiedUser);
                        updateScreen('onboarding');
                    }}
                    onSignOut={() => {
                        setPendingVerifyUser(null);
                        updateScreen('splash');
                    }}
                />
            )}
            {(currentScreen === 'onboarding' && (pendingOnboardingUser || user)) && (
                <OnboardingScreen
                    user={pendingOnboardingUser || user!}
                    onComplete={() => {
                        setPendingOnboardingUser(null);
                        goToDashboard();
                    }}
                />
            )}
            {currentScreen === 'dashboard' && user && !pendingOnboardingUser && !pendingVerifyUser && (
                <ErrorBoundary>
                    <Dashboard onLogout={() => {
                        auth.signOut();
                        updateScreen('splash');
                    }} />
                </ErrorBoundary>
            )}
        </>
    );
}
