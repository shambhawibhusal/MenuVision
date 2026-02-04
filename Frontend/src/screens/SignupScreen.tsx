import React, { useState } from 'react';
import {
    signInWithPhoneNumber,
    EmailAuthProvider,
    linkWithCredential,
    updateProfile,
    RecaptchaVerifier
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import foodBackground from '../assets/food.png';
import BackButton from '../components/BackButton';
import { containerStyle } from '../utils/styles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

import { User, ConfirmationResult } from 'firebase/auth';

declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
        confirmationResult: ConfirmationResult;
    }
}

interface SignupScreenProps {
    onBack: () => void;
    onSignupSuccess: (user: User) => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onBack, onSignupSuccess }) => {
    const [formData, setFormData] = useState({ email: '', fullname: '', phone: '', password: '', confirmPassword: '' });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSignupClick = async () => {
        const { email, fullname, phone, password, confirmPassword } = formData;
        if (!email || !fullname || !phone || !password || !confirmPassword) { setError('Please fill in all fields.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email address.'); return; }
        if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) { setError('Phone number must be exactly 10 digits.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true); setError('');

        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                    'callback': () => { }
                });
            }
            const formattedPhoneNumber = `+977${phone}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setLoading(false); setShowOtpPopup(true); alert(`OTP sent to ${formattedPhoneNumber}`);
        } catch (err: any) {
            console.error(err); setLoading(false);
            if (err.code === 'auth/invalid-phone-number') setError('Invalid phone format. Add country code (e.g., +91).');
            else setError(err.message);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { alert('Please enter 6-digit OTP'); return; }
        setLoading(true);
        try {
            const phoneCredential = await window.confirmationResult.confirm(otp);
            const user = phoneCredential.user;
            const credential = EmailAuthProvider.credential(formData.email, formData.password);

            try {
                await linkWithCredential(user, credential);
            } catch (linkError: any) {
                if (linkError.code !== 'auth/provider-already-linked') throw linkError;
            }

            await updateProfile(user, { displayName: formData.fullname });
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid, fullname: formData.fullname, email: formData.email, phone: formData.phone, createdAt: new Date()
            });
            onSignupSuccess(user);
        } catch (err: any) {
            console.error(err); setLoading(false); alert('Verification Failed: ' + err.message);
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
                        </CardFooter>
                    </Card>
                </div>

                <Dialog open={showOtpPopup} onOpenChange={setShowOtpPopup}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-center">Verify Phone Number</DialogTitle>
                            <DialogDescription className="text-center">
                                Enter the 6-digit code sent to <br /><span className="font-bold text-black">+977 {formData.phone}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center py-4">
                            <Input
                                type="number"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="h-14 text-2xl text-center tracking-[10px] font-bold border-2"
                            />
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-col gap-2">
                            <Button onClick={handleVerifyOtp} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12">
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </Button>
                            <Button variant="ghost" onClick={() => setShowOtpPopup(false)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
}

export default SignupScreen;

