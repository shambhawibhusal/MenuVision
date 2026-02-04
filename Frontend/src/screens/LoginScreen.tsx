import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import foodBackground from '../assets/food.png';
import BackButton from '../components/BackButton';
import { containerStyle } from '../utils/styles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

import { User } from 'firebase/auth';

interface LoginScreenProps {
    onBack: () => void;
    onSignupClick: () => void;
    onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onSignupClick, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) { setError('All fields are required.'); return; }
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const loggedInUser = userCredential.user;
            onLoginSuccess(loggedInUser); // Pass the user object to App.tsx

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') setError('No account found. Please Sign Up first.');
            else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
            else if (err.code === 'auth/invalid-credential') setError('No account found or incorrect details.');
            else setError('Login failed.');
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
            <div className={containerStyle}>
                <img src={foodBackground} alt="Food background" className="absolute top-0 left-0 w-full h-full object-cover z-[1]" />
                <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[2]"></div>
                <BackButton onClick={onBack} />
                <div className="relative w-full h-full z-[3] flex flex-col items-center justify-center p-5">
                    <Card className="w-full max-w-[350px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
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
                                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
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
                            <div className="text-sm text-gray-600">
                                Don't have an account? <span onClick={onSignupClick} className="text-black font-bold cursor-pointer hover:underline">Sign up</span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;

