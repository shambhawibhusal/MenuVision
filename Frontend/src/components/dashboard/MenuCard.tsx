import React from 'react';
import { Card, CardTitle } from "@/components/ui/card";
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
        <Card onClick={onClick} className="cursor-pointer bg-white hover:bg-amber-50/30 border border-gray-100 text-gray-900 transition-all overflow-hidden group relative shadow-sm hover:shadow-md hover:shadow-amber-100/50 transform hover:-translate-y-0.5 w-full rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col sm:flex-row sm:items-center h-full relative z-10">
                {item.imageUrl && (
                    <div className="w-full sm:w-28 h-32 sm:h-24 shrink-0 overflow-hidden">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="flex-1 p-5 pb-2 sm:pb-5 sm:pr-2">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <CardTitle className="text-xl font-bold leading-tight decoration-amber-400 group-hover:underline decoration-2 underline-offset-4 tracking-tight text-gray-900">
                            {item.name}
                        </CardTitle>
                        {onLike && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 sm:hidden"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLike();
                                }}
                            >
                                <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                            </Button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-medium">
                        {item.description || "A delicious choice from the menu."}
                    </p>
                </div>

                <div className="p-5 pt-0 sm:pt-5 sm:pl-2 min-w-[30%] flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3 border-t sm:border-t-0 sm:border-l border-gray-100 bg-gray-50/50 sm:bg-transparent">
                    <span className="text-amber-600 font-bold text-lg whitespace-nowrap bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">
                        {item.price}
                    </span>

                    <div className="hidden sm:block">
                        {onLike && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
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
                            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
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
