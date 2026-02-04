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
            alert('Account Verified & Created!'); onSignupSuccess(user);
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
                    <div className="bg-white w-full max-w-[350px] py-10 px-5 flex flex-col items-center shadow-md rounded-lg">
                        <div className="w-full flex items-center justify-between mb-6">
                            <label className="text-lg text-black whitespace-nowrap">Email:</label>
                            <input name="email" onChange={handleChange} type="email" className="w-[55%] h-[30px] border border-[#555] pl-1" />
                        </div>
                        <div className="w-full flex items-center justify-between mb-6">
                            <label className="text-lg text-black whitespace-nowrap">Full name:</label>
                            <input name="fullname" onChange={handleChange} type="text" className="w-[55%] h-[30px] border border-[#555] pl-1" />
                        </div>
                        <div className="w-full flex items-center justify-between mb-6">
                            <label className="text-lg text-black whitespace-nowrap">Phone no:</label>
                            <input name="phone" placeholder="98XXXXXXXX" onChange={handleChange} type="tel" className="w-[55%] h-[30px] border border-[#555] pl-1" />
                        </div>
                        <div className="w-full flex items-center justify-between mb-6">
                            <label className="text-lg text-black whitespace-nowrap">Password:</label>
                            <input name="password" onChange={handleChange} type="password" className="w-[55%] h-[30px] border border-[#555] pl-1" />
                        </div>
                        <div className="w-full flex items-center justify-between mb-6">
                            <label className="text-lg text-black whitespace-nowrap">Confirm:</label>
                            <input name="confirmPassword" onChange={handleChange} type="password" className="w-[35%] h-[30px] border border-[#555] pl-1" />
                        </div>
                        {error && <div className="text-red-600 text-[14px] font-bold mb-[10px] text-center">{error}</div>}
                        <button onClick={handleSignupClick} disabled={loading} className="w-[200px] py-[10px] rounded-full border-[3px] border-black bg-white text-black text-xl font-medium cursor-pointer disabled:opacity-50 hover:bg-black hover:text-white transition-colors">{loading ? 'Processing...' : 'Sign Up'}</button>
                    </div>
                </div>
                {showOtpPopup && (
                    <div className="absolute top-0 left-0 w-full h-full bg-black/80 z-[100] flex items-center justify-center">
                        <div className="bg-white p-[30px] rounded-lg w-[85%] max-w-[320px] text-center">
                            <h3 className="mb-5 text-[22px] font-bold">Verification</h3>
                            <p className="mb-5">Enter the OTP sent to <br /><b>+977 {formData.phone}</b></p>
                            <input type="number" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full h-[45px] text-[22px] text-center tracking-[5px] mb-5 border-2 border-gray-300 rounded" />
                            <button onClick={handleVerifyOtp} className="w-full p-3 bg-green-600 text-white text-lg rounded-md border-none cursor-pointer mb-[10px] hover:bg-green-700 transition-colors">Verify Code</button>
                            <button onClick={() => setShowOtpPopup(false)} className="bg-none border-none text-red-600 cursor-pointer underline">Cancel</button>
                        </div>
                    </div>
                )}
                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
}

export default SignupScreen;
