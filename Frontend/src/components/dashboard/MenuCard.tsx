import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScannedItem } from '@/types/dashboard';
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MenuCardProps {
    item: ScannedItem;
    onClick: () => void;
    isLiked?: boolean;
    onLike?: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, onClick, isLiked = false, onLike }) => {
    return (
        <Card onClick={onClick} className="cursor-pointer hover:bg-white/10 border-none bg-black/40 backdrop-blur-md text-white transition-all overflow-hidden group relative shadow-lg hover:shadow-amber-400/20 transform hover:-translate-y-1 w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col sm:flex-row sm:items-center h-full relative z-10">
                <div className="flex-1 p-5 pb-2 sm:pb-5 sm:pr-2">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <CardTitle className="text-xl font-bold leading-tight decoration-amber-400 group-hover:underline decoration-2 underline-offset-4 tracking-tight">
                            {item.name}
                        </CardTitle>
                        {onLike && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-white/20 text-white sm:hidden"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLike();
                                }}
                            >
                                <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                            </Button>
                        )}
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                        {item.description || "A delicious choice from the menu."}
                    </p>
                </div>

                <div className="p-5 pt-0 sm:pt-5 sm:pl-2 min-w-[30%] flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3 border-t sm:border-t-0 sm:border-l border-white/10 bg-black/20 sm:bg-transparent">
                    <span className="text-amber-400 font-bold text-lg whitespace-nowrap bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                        {item.price}
                    </span>

                    <div className="hidden sm:block">
                        {onLike && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full hover:bg-white/20 text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLike();
                                }}
                            >
                                <Heart size={20} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {item.calories && (
                            <span className="text-xs font-medium text-amber-200/80 bg-amber-900/40 border border-amber-700/50 px-2 py-1 rounded-md flex items-center gap-1">
                                🔥 {item.calories}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default MenuCard;
