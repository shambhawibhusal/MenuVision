import React from 'react';
import foodBackground from '../assets/food.png';
import { containerStyle } from '../utils/styles';

interface SplashScreenProps {
    onGetStarted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
    return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-300">
            <div className={containerStyle}>
                <img
                    src={foodBackground}
                    alt="Food background"
                    className="absolute top-0 left-0 w-full h-full object-cover z-[1] brightness-80"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-black/80 z-[2]"></div>
                <div className="relative w-full h-full flex flex-col items-center justify-end pb-20 text-white text-center z-[3]">
                    <div className="animate-fade mb-5 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[20px] flex items-center justify-center mb-[15px] border border-white/40">
                            <span className="text-[40px]">🍽️</span>
                        </div>
                    </div>
                    <div className="animate-slide-up [animation-delay:0.2s] opacity-0 fill-mode-forwards">
                        <h1 className="text-[42px] font-extrabold mb-1 tracking-wider drop-shadow-lg font-sans">
                            Menu<span className="text-amber-400">Vision</span>
                        </h1>
                        <p className="text-base font-light opacity-90 tracking-[2px] mb-10 uppercase">SMART MENUS, SMART CHOICES</p>
                    </div>
                    <p className="animate-slide-up [animation-delay:0.4s] opacity-0 fill-mode-forwards text-base leading-relaxed mb-[50px] px-[30px] text-gray-200 max-w-[350px]">
                        Discover delicious flavors and explore personalized dining experiences like never before.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="animate-pulse-custom px-[60px] py-[18px] text-lg font-bold border-none rounded-full bg-amber-400 text-black cursor-pointer shadow-[0_10px_25px_rgba(251,191,36,0.4)] transition-transform tracking-tight hover:scale-105 active:scale-95"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SplashScreen;
