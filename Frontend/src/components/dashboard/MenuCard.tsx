import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScannedItem } from '@/types/dashboard';

interface MenuCardProps {
    item: ScannedItem;
    onClick: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, onClick }) => {
    return (
        <Card onClick={onClick} className="cursor-pointer hover:bg-white/10 border-none bg-black/40 backdrop-blur-md text-white transition-all overflow-hidden group relative shadow-lg hover:shadow-amber-400/20 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Decorative Icon/Placeholder if needed, for now just cool spacing */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-colors" />

            <CardHeader className="p-5 pb-2 relative z-10">
                <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-xl font-bold leading-tight decoration-amber-400 group-hover:underline decoration-2 underline-offset-4 tracking-tight">
                        {item.name}
                    </CardTitle>
                    <span className="text-amber-400 font-bold text-lg whitespace-nowrap bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                        {item.price}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-2 relative z-10">
                <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                    {item.description || "A delicious choice from the menu."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {item.calories && (
                        <span className="text-xs font-medium text-amber-200/80 bg-amber-900/40 border border-amber-700/50 px-2 py-1 rounded-md flex items-center gap-1">
                            🔥 {item.calories}
                        </span>
                    )}
                    {item.ingredients && (
                        <span className="text-xs font-medium text-gray-300 bg-white/10 border border-white/10 px-2 py-1 rounded-md line-clamp-1 flex items-center gap-1">
                            🥗 {item.ingredients}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default MenuCard;
