import React, { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import foodBackground from '../assets/food.png';
import BackButton from '../components/BackButton';
import { containerStyle } from '../utils/styles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";


import { User } from 'firebase/auth';

interface SignupScreenProps {
    onBack: () => void;
    onSignupSuccess: (user: User) => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onBack, onSignupSuccess }) => {
    const [formData, setFormData] = useState({ email: '', fullname: '', phone: '', password: '', confirmPassword: '' });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    fullname: user.displayName || 'Unknown',
                    email: user.email,
                    phone: user.phoneNumber || '',
                    createdAt: new Date()
                });
            }
            onSignupSuccess(user);
        } catch (err: any) {
            console.error(err);
            setLoading(false);
            setError(err.message);
        }
    };

    const handleSignupClick = async () => {
        const { email, fullname, phone, password, confirmPassword } = formData;
        if (!email || !fullname || !phone || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address.'); return; }
        if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) { setError('Phone number must be exactly 10 digits.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true); setError('');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: fullname });
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid, fullname: fullname, email: email, phone: phone, createdAt: new Date()
            });
            onSignupSuccess(user);
        } catch (err: any) {
            console.error(err);
            setLoading(false);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already in use.');
            } else {
                setError(err.message);
            }
        }
    };



    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
            <div className={containerStyle}>
                <img src={foodBackground} alt="Food background" className="absolute top-0 left-0 w-full h-full object-cover z-[1]" />
                <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[2]"></div>
                <BackButton onClick={onBack} />
                <div className="relative w-full h-full z-[3] flex flex-col items-center justify-center p-5">
                    <Card className="w-full max-w-[360px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                        <CardHeader className="flex flex-col items-center pt-6">
                            <CardTitle className="text-2xl font-bold tracking-tight text-black">Create Account</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 px-6 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="fullname" className="text-xs font-semibold text-gray-700">Full Name</Label>
                                    <Input id="fullname" name="fullname" value={formData.fullname} onChange={handleChange} placeholder="John Doe" autoComplete="name" className="h-9 border-gray-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">Phone</Label>
                                    <Input id="phone" name="phone" value={formData.phone} placeholder="98XXXXXXXX" onChange={handleChange} type="tel" autoComplete="tel" className="h-9 border-gray-200" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address</Label>
                                <Input id="email" name="email" value={formData.email} onChange={handleChange} type="email" placeholder="john@example.com" autoComplete="email" className="h-9 border-gray-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Password</Label>
                                    <Input id="password" name="password" value={formData.password} onChange={handleChange} type="password" placeholder="••••••••" autoComplete="new-password" className="h-9 border-gray-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700">Confirm</Label>
                                    <Input id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password" placeholder="••••••••" autoComplete="new-password" className="h-9 border-gray-200" />
                                </div>
                            </div>
                            {error && <div className="text-red-600 text-[12px] font-bold text-center">{error}</div>}
                        </CardContent>
                        <CardFooter className="flex flex-col pb-8 px-6">
                            <Button
                                onClick={handleSignupClick}
                                disabled={loading}
                                className="w-full h-11 rounded-full bg-black text-white hover:bg-gray-800 text-lg font-bold transition-all hover:scale-[1.02]"
                            >
                                {loading ? 'Processing...' : 'Sign Up'}
                            </Button>

                            <div className="relative my-4 w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white/95 px-2 text-gray-500 rounded">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleGoogleSignup}
                                disabled={loading}
                                className="w-full h-11 rounded-full border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold transition-all hover:scale-[1.02]"
                            >
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Continue with Google
                            </Button>
                        </CardFooter>
                    </Card>
                </div>


            </div>
        </div>
    );
}

export default SignupScreen;

