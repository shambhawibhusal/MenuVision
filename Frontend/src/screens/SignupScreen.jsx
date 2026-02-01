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

function SignupScreen({ onBack, onSignupSuccess }) {
    const [formData, setFormData] = useState({ email: '', fullname: '', phone: '', password: '', confirmPassword: '' });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
                    'callback': (response) => { }
                });
            }
            const formattedPhoneNumber = `+977${phone}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setLoading(false); setShowOtpPopup(true); alert(`OTP sent to ${formattedPhoneNumber}`);
        } catch (err) {
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
            } catch (linkError) {
                if (linkError.code !== 'auth/provider-already-linked') throw linkError;
            }

            await updateProfile(user, { displayName: formData.fullname });
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid, fullname: formData.fullname, email: formData.email, phone: formData.phone, createdAt: new Date()
            });
            alert('Account Verified & Created!'); onSignupSuccess(user);
        } catch (err) {
            console.error(err); setLoading(false); alert('Verification Failed: ' + err.message);
        }
    };

    const rowStyle = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' };
    const labelStyle = { fontSize: '18px', color: 'black', whiteSpace: 'nowrap' };
    const inputStyle = { width: '55%', height: '30px', border: '1px solid #555', paddingLeft: '5px' };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
                <BackButton onClick={onBack} />
                <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
                        <div style={rowStyle}><label style={labelStyle}>Email:</label><input name="email" onChange={handleChange} type="email" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Full name:</label><input name="fullname" onChange={handleChange} type="text" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Phone no:</label><input name="phone" placeholder="98XXXXXXXX" onChange={handleChange} type="tel" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Password:</label><input name="password" onChange={handleChange} type="password" style={inputStyle} /></div>
                        <div style={rowStyle}><label style={labelStyle}>Confirm:</label><input name="confirmPassword" onChange={handleChange} type="password" style={{ ...inputStyle, width: '35%' }} /></div>
                        {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
                        <button onClick={handleSignupClick} disabled={loading} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '20px', fontWeight: '500', cursor: 'pointer' }}>{loading ? 'Processing...' : 'Sign Up'}</button>
                    </div>
                </div>
                {showOtpPopup && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '85%', maxWidth: '320px', textAlign: 'center' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: 'bold' }}>Verification</h3>
                            <p style={{ marginBottom: '20px' }}>Enter the OTP sent to <br /><b>+977 {formData.phone}</b></p>
                            <input type="number" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: '100%', height: '45px', fontSize: '22px', textAlign: 'center', letterSpacing: '5px', marginBottom: '20px', border: '2px solid #ccc', borderRadius: '5px' }} />
                            <button onClick={handleVerifyOtp} style={{ width: '100%', padding: '12px', backgroundColor: 'green', color: 'white', fontSize: '18px', borderRadius: '5px', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>Verify Code</button>
                            <button onClick={() => setShowOtpPopup(false)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                        </div>
                    </div>
                )}
                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
}

export default SignupScreen;
