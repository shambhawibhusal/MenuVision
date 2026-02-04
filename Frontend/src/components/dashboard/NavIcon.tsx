import React from 'react';
import { Tab } from '@/types/dashboard';

interface NavIconProps {
    name: Tab;
    label: string;
    icon: React.ReactNode;
    activeTab: Tab;
    setActiveTab: (name: Tab) => void;
}

const NavIcon: React.FC<NavIconProps> = ({ name, label, icon, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${activeTab === name ? 'text-black' : 'text-gray-400 hover:text-gray-600'
            }`}
    >
        <div className={`transition-transform duration-300 ${activeTab === name ? 'scale-110 -translate-y-1' : ''}`}>
            {icon}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-tighter transition-all ${activeTab === name ? 'opacity-100' : 'opacity-0 scale-75'
            }`}>{label}</span>
        {activeTab === name && (
            <div className="absolute -top-3 w-1.5 h-1.5 bg-black rounded-full" />
        )}
    </button>
);

export default NavIcon;
