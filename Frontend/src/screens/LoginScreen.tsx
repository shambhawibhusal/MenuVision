import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import foodBackground from '../assets/food.png';
import BackButton from '../components/BackButton';
import { containerStyle } from '../utils/styles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { setGoogleAuthProcessing } from '../utils/googleAuthGuard';

import { User } from 'firebase/auth';

interface LoginScreenProps {
    onBack: () => void;
    onSignupClick: () => void;
    onLoginSuccess: (user: User) => void;
    onVerifyEmail: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onSignupClick, onLoginSuccess, onVerifyEmail }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) { setError('All fields are required.'); return; }
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const loggedInUser = userCredential.user;

            if (!loggedInUser.emailVerified) {
                onVerifyEmail(loggedInUser);
                return;
            }

            onLoginSuccess(loggedInUser);

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') setError('No account found. Please Sign Up first.');
            else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
            else if (err.code === 'auth/invalid-credential') setError('No account found or incorrect details.');
            else setError('Login failed.');
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setGoogleAuthProcessing(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const additionalInfo = getAdditionalUserInfo(userCredential);
            if (additionalInfo?.isNewUser) {
                await userCredential.user.delete();
                setError('No account found.');
                return;
            }

            if (userCredential.user.providerData.some(p => p.providerId === 'password')) {
                await signOut(auth);
                setError('This account was registered with email/password. Please login with your credentials.');
                return;
            }

            onLoginSuccess(userCredential.user);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/account-exists-with-different-credential') {
                setError('This email is already registered with email/password.');
            } else {
                setError('Google login failed.');
            }
        } finally {
            setGoogleAuthProcessing(false);
        }
    };

    const handleForgotPassword = async () => {
        const targetEmail = forgotEmail.trim() || email.trim();
        if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
            setResetError('Please enter a valid email address.');
            return;
        }
        setResetLoading(true);
        setResetError('');
        try {
            await sendPasswordResetEmail(auth, targetEmail, {
                url: window.location.origin,
                handleCodeInApp: true,
            });
            setResetSent(true);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                setResetError('No account found with this email.');
            } else {
                setResetError(err.message || 'Failed to send reset email.');
            }
        } finally {
            setResetLoading(false);
        }
    };

    const closeForgotPassword = () => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setResetSent(false);
        setResetError('');
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
            <div className={containerStyle}>
                <img src={foodBackground} alt="Food background" className="absolute top-0 left-0 w-full h-full object-cover z-[1]" />
                <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[2]"></div>
                <BackButton onClick={onBack} />
                <div className="relative w-full h-full z-[3] flex flex-col items-center justify-center p-5">
                    {!showForgotPassword ? (
                        <Card className="w-full max-w-[350px] md:max-w-[420px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                            <CardHeader className="flex flex-col items-center pt-8">
                                <CardTitle className="text-3xl font-bold tracking-tight text-black">Welcome Back</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 px-6">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        className="h-11 border-gray-200 focus:ring-black"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                                        <span
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-xs font-medium text-gray-400 hover:text-black cursor-pointer transition-colors"
                                        >
                                            Forgot Password?
                                        </span>
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        className="h-11 border-gray-200 focus:ring-black"
                                    />
                                </div>
                                {error && <div className="text-red-600 text-[14px] font-bold text-center animate-shake">{error}</div>}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4 pb-10 px-6">
                                <Button
                                    onClick={handleLogin}
                                    className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-lg font-bold transition-all hover:scale-[1.02]"
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={handleGoogleLogin}
                                    className="w-full h-12 rounded-full bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-100 text-lg font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Continue with Google
                                </Button>
                                <div className="text-sm text-gray-600">
                                    Don't have an account? <span onClick={onSignupClick} className="text-black font-bold cursor-pointer hover:underline">Sign up</span>
                                </div>
                            </CardFooter>
                        </Card>
                    ) : (
                        <Card className="w-full max-w-[350px] md:max-w-[420px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                            <CardHeader className="flex flex-col items-center pt-8 md:pt-10">
                                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-black">Reset Password</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 md:space-y-5 px-6">
                                {resetSent ? (
                                    <div className="text-center space-y-3">
                                        <div className="text-green-600 text-sm md:text-base font-medium">Reset link sent!</div>
                                        <p className="text-gray-500 text-sm md:text-base">Check your inbox for a password reset link.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2 text-left">
                                            <Label htmlFor="forgotEmail" className="text-sm font-semibold text-gray-700">Email Address</Label>
                                            <Input
                                                id="forgotEmail"
                                                type="email"
                                                placeholder="your@email.com"
                                                value={forgotEmail || email}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                autoComplete="email"
                                                className="h-11 border-gray-200"
                                            />
                                        </div>
                                        {resetError && <div className="text-red-600 text-[13px] font-medium text-center">{resetError}</div>}
                                    </>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3 pb-8 md:pb-10 px-6">
                                {!resetSent ? (
                                    <Button
                                        onClick={handleForgotPassword}
                                        disabled={resetLoading}
                                        className="w-full h-12 rounded-full bg-black text-white hover:bg-gray-800 text-lg font-bold transition-all"
                                    >
                                        {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleForgotPassword}
                                        disabled={resetLoading}
                                        variant="outline"
                                        className="w-full h-12 rounded-full border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold transition-all"
                                    >
                                        {resetLoading ? 'Sending...' : 'Resend Link'}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    onClick={closeForgotPassword}
                                    className="w-full text-gray-400 hover:text-gray-600 font-medium"
                                >
                                    Back to Login
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;
