import React, { useState, useEffect } from 'react';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';
import foodBackground from '../assets/food.png';
import { containerStyle } from '../utils/styles';
import { PASSWORD_RULES, allRulesPass } from '../utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { notifyReset } from '../utils/broadcast';

interface ResetPasswordScreenProps {
    oobCode: string;
    onBackToLogin: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ oobCode, onBackToLogin }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [codeValid, setCodeValid] = useState(false);
    const [showPasswordRules, setShowPasswordRules] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const verifyCode = async () => {
            try {
                await verifyPasswordResetCode(auth, oobCode);
                if (!cancelled) {
                    setCodeValid(true);
                }
            } catch {
                if (!cancelled) {
                    setCodeValid(false);
                }
            } finally {
                if (!cancelled) {
                    setVerifying(false);
                }
            }
        };
        verifyCode();
        return () => { cancelled = true; };
    }, [oobCode]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setShowPasswordRules(true);
    };

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (!allRulesPass(password)) {
            setError('Password does not meet all requirements.');
            setShowPasswordRules(true);
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await confirmPasswordReset(auth, oobCode, password);
            notifyReset();
            setSuccess(true);
            setTimeout(() => window.close(), 1500);
        } catch (err: any) {
            if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger password.');
            } else {
                setError(err.message || 'Failed to reset password.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
                <div className={containerStyle}>
                    <img src={foodBackground} alt="Food background" className="absolute top-0 left-0 w-full h-full object-cover z-[1]" />
                    <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[2]"></div>
                    <div className="relative w-full h-full z-[3] flex flex-col items-center justify-center p-5">
                        <Card className="w-full max-w-[360px] md:max-w-[420px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                            <CardContent className="py-12 md:py-14 text-center">
                                <div className="text-gray-500 text-sm md:text-base">Verifying reset link...</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!codeValid) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
                <div className={containerStyle}>
                    <img src={foodBackground} alt="Food background" className="absolute top-0 left-0 w-full h-full object-cover z-[1]" />
                    <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[2]"></div>
                    <div className="relative w-full h-full z-[3] flex flex-col items-center justify-center p-5">
                        <Card className="w-full max-w-[360px] md:max-w-[420px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                            <CardHeader className="flex flex-col items-center pt-8 md:pt-10">
                                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-black">Invalid Link</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 md:space-y-5 px-6 text-center">
                                <p className="text-gray-500 text-sm md:text-base">This password reset link is invalid or has expired. Please request a new one.</p>
                            </CardContent>
                            <CardFooter className="flex flex-col pb-8 md:pb-10 px-6">
                                <Button
                                    onClick={onBackToLogin}
                                    className="w-full h-11 md:h-12 rounded-full bg-black text-white hover:bg-gray-800 text-lg font-bold transition-all hover:scale-[1.02]"
                                >
                                    Back to Login
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
            <div className={containerStyle}>
                <img src={foodBackground} alt="Food background" className="absolute top-0 left-0 w-full h-full object-cover z-[1]" />
                <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[2]"></div>
                <div className="relative w-full h-full z-[3] flex flex-col items-center justify-center p-5">
                    <Card className="w-full max-w-[360px] md:max-w-[420px] shadow-2xl border-none bg-white/95 backdrop-blur-sm">
                        <CardHeader className="flex flex-col items-center pt-8 md:pt-10">
                            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-black">
                                {success ? 'Password Reset' : 'Set New Password'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 md:space-y-5 px-6 pt-2">
                            {success ? (
                                <div className="text-center space-y-3">
                                    <div className="text-green-600 text-sm md:text-base font-medium">Password reset successfully!</div>
                                    <p className="text-gray-500 text-sm md:text-base">You can now log in with your new password.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1.5 md:space-y-2">
                                        <Label htmlFor="newPassword" className="text-xs md:text-sm font-semibold text-gray-700">New Password</Label>
                                        <Input
                                            id="newPassword"
                                            name="password"
                                            value={password}
                                            onChange={handlePasswordChange}
                                            type="password"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            className="h-9 md:h-11 border-gray-200"
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2">
                                        <Label htmlFor="confirmNewPassword" className="text-xs md:text-sm font-semibold text-gray-700">Confirm Password</Label>
                                        <Input
                                            id="confirmNewPassword"
                                            name="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            type="password"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            className="h-9 md:h-11 border-gray-200"
                                        />
                                    </div>
                                    {showPasswordRules && (
                                        <div className="space-y-1.5 p-3 md:p-4 rounded-lg bg-gray-50">
                                            <p className="text-[11px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Password Requirements</p>
                                            {PASSWORD_RULES.map((rule) => {
                                                const passes = rule.test(password);
                                                return (
                                                    <div key={rule.label} className={`flex items-center gap-2 text-xs md:text-sm ${passes ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {passes ? <Check size={14} /> : <X size={14} />}
                                                        {rule.label}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {error && <div className="text-red-600 text-[12px] md:text-sm font-bold text-center">{error}</div>}
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col pb-8 md:pb-10 px-6 gap-3">
                            {success ? (
                                <Button
                                    onClick={onBackToLogin}
                                    className="w-full h-11 md:h-12 rounded-full bg-black text-white hover:bg-gray-800 text-lg font-bold transition-all hover:scale-[1.02]"
                                >
                                    Back to Login
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleResetPassword}
                                        disabled={loading}
                                        className="w-full h-11 md:h-12 rounded-full bg-black text-white hover:bg-gray-800 text-lg font-bold transition-all hover:scale-[1.02]"
                                    >
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={onBackToLogin}
                                        className="w-full text-gray-400 hover:text-gray-600 font-medium"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordScreen;
