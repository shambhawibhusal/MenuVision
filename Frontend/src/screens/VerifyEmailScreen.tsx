import React, { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import foodBackground from '../assets/food.png';
import { containerStyle } from '../utils/styles';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Mail, RefreshCw, CheckCircle, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface VerifyEmailScreenProps {
    user: User;
    onVerified: () => void;
    onSignOut: () => void;
}

const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ user, onVerified, onSignOut }) => {
    const [resending, setResending] = useState(false);
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState('');

    const handleResend = async () => {
        setResending(true);
        setMessage('');
        try {
            await sendEmailVerification(user);
            setMessage('Verification email resent! Check your inbox.');
        } catch (err: any) {
            setMessage(err.message || 'Failed to resend verification email.');
        } finally {
            setResending(false);
        }
    };

    const handleCheckVerified = async () => {
        setChecking(true);
        setMessage('');
        try {
            await user.reload();
            if (user.emailVerified) {
                onVerified();
            } else {
                setMessage('Email not yet verified. Please check your inbox and click the verification link.');
            }
        } catch {
            setMessage('Failed to check verification status. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            onSignOut();
        } catch {
            onSignOut();
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
            <div className={containerStyle}>
                <img src={foodBackground} alt="Food background" className="absolute top-0 left-0 w-full h-full object-cover z-[1]" />
                <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[2]"></div>
                <div className="relative w-full h-full z-[3] flex flex-col items-center justify-center p-5">
                    <Card className="w-full max-w-[360px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                        <CardHeader className="flex flex-col items-center pt-8">
                            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                                <Mail size={32} className="text-amber-500" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight text-black">Verify Your Email</CardTitle>
                            <CardDescription className="text-center text-gray-500 pt-2">
                                We sent a verification link to <span className="font-semibold text-gray-700">{user.email}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 px-6 pt-2">
                            <p className="text-sm text-gray-500 text-center">
                                Click the link in the email to verify your account. If you don't see it, check your spam folder.
                            </p>
                            {message && (
                                <div className={`text-[13px] font-medium text-center p-2 rounded-lg ${message.includes('not yet') || message.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {message}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pb-8 px-6">
                            <Button
                                onClick={handleCheckVerified}
                                disabled={checking}
                                className="w-full h-11 rounded-full bg-black text-white hover:bg-gray-800 font-bold transition-all"
                            >
                                {checking ? (
                                    <span className="flex items-center gap-2"><RefreshCw size={18} className="animate-spin" /> Checking...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><CheckCircle size={18} /> I've Verified My Email</span>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleResend}
                                disabled={resending}
                                className="w-full h-11 rounded-full border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold transition-all"
                            >
                                {resending ? 'Resending...' : (
                                    <span className="flex items-center gap-2"><RefreshCw size={18} /> Resend Email</span>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleSignOut}
                                className="w-full h-11 rounded-full text-gray-400 hover:text-gray-600 font-medium"
                            >
                                <LogOut size={18} className="mr-2" /> Sign Out
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailScreen;
