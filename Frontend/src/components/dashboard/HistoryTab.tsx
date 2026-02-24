import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { HistoryItem, Dish } from '@/types/dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MenuCard from './MenuCard';

interface HistoryTabProps {
    historyItems: HistoryItem[];
    favoriteItems: Dish[];
    toggleLike: (dish: Dish) => void;
    onSelectHistoryItem: (item: HistoryItem) => void;
    onDeleteHistoryItem: (item: HistoryItem) => void;
    onSelectFavorite: (dish: Dish) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ historyItems, favoriteItems, toggleLike, onSelectHistoryItem, onDeleteHistoryItem, onSelectFavorite }) => {
    return (
        <div className="p-5 flex flex-col h-full animate-fade">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">My Activity</h2>

            <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 border border-gray-200 h-12 p-1 mb-8 rounded-xl">
                    <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 font-medium transition-all">Scan History</TabsTrigger>
                    <TabsTrigger value="favorites" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 font-medium transition-all">Favorite Dishes</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    {historyItems.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">No history yet.</div>
                    ) : (
                        historyItems.map(item => (
                            <Card
                                key={item.id}
                                className="bg-white border border-gray-100 text-gray-900 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden relative rounded-2xl"
                            >
                                <div className="w-1.5 h-full bg-amber-400 absolute left-0 top-0" />
                                <CardContent className="p-5 pl-7">
                                    <div className="flex justify-between items-start mb-2">
                                        <div onClick={() => onSelectHistoryItem(item)} className="flex-1">
                                            <h4 className="text-lg font-bold">{item.place}</h4>
                                            {item.location && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                    <MapPin size={10} /> {item.location}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{item.date}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteHistoryItem(item);
                                                }}
                                                className="h-8 w-8 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div onClick={() => onSelectHistoryItem(item)}>
                                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.items}</p>
                                        <div className="text-xl font-bold text-amber-500">{item.total}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="favorites" className="space-y-4">
                    {favoriteItems.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">No favorite dishes yet.</div>
                    ) : (
                        favoriteItems.map(dish => (
                            <MenuCard
                                key={dish.id}
                                item={dish}
                                onClick={() => onSelectFavorite(dish)}
                                isLiked={true}
                                onLike={() => toggleLike(dish)}
                            />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default HistoryTab;
