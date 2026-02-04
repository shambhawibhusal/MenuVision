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
        <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
            <div className={containerStyle}>
                <img src={foodBackground} alt="Food background" className="absolute top-0 left-0 w-full h-full object-cover z-[1]" />
                <div className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-[2px] z-[2]"></div>
                <BackButton onClick={onBack} />
                <div className="relative w-full h-full z-[3] flex flex-col items-center justify-center p-5">
                    <div className="bg-white w-full max-w-[350px] py-10 px-5 flex flex-col items-center shadow-md rounded-lg">
                        <div className="w-full flex items-center justify-between mb-[30px]">
                            <label className="text-xl color-black mr-[10px]">Email:</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-[60%] h-[35px] border border-[#555] pl-1" />
                        </div>
                        <div className={`w-full flex items-center justify-between ${error ? 'mb-5' : 'mb-[60px]'}`}>
                            <label className="text-xl color-black mr-[10px]">Password:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-[60%] h-[35px] border border-[#555] pl-1" />
                        </div>
                        {error && <div className="text-red-600 text-[14px] font-bold mb-5 text-center">{error}</div>}
                        <button onClick={handleLogin} className="w-[200px] py-[10px] rounded-full border-[3px] border-black bg-white text-black text-[22px] font-medium cursor-pointer mb-5 hover:bg-black hover:text-white transition-colors">Login</button>
                        <div className="text-base text-black">Dont have account? <span onClick={onSignupClick} className="text-blue-600 cursor-pointer hover:underline">Signup</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginScreen;
