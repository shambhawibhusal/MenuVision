import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import foodBackground from '../assets/food.png';
import BackButton from '../components/BackButton';
import { containerStyle } from '../utils/styles';

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
            alert('Login Successful!');
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
        <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d1d5db' }}>
            <div style={containerStyle}>
                <img src={foodBackground} alt="Food background" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)', zIndex: 2 }}></div>
                <BackButton onClick={onBack} />
                <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '350px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '10px' }}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Email:</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
                        </div>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: error ? '20px' : '60px' }}>
                            <label style={{ fontSize: '20px', color: 'black', marginRight: '10px' }}>Password:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '60%', height: '35px', border: '1px solid #555', paddingLeft: '5px' }} />
                        </div>
                        {error && <div style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
                        <button onClick={handleLogin} style={{ width: '200px', padding: '10px 0', borderRadius: '50px', border: '3px solid black', backgroundColor: 'white', color: 'black', fontSize: '22px', fontWeight: '500', cursor: 'pointer', marginBottom: '20px' }}>Login</button>
                        <div style={{ fontSize: '16px', color: 'black' }}>Dont have account? <span onClick={onSignupClick} style={{ color: '#3b82f6', cursor: 'pointer' }}>Signup</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;
