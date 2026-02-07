import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { HistoryItem, Dish } from '@/types/dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HistoryTabProps {
    historyItems: HistoryItem[];
    favoriteItems: Dish[];
    toggleLike: (dish: Dish) => void;
    onSelectHistoryItem: (item: HistoryItem) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ historyItems, favoriteItems, toggleLike, onSelectHistoryItem }) => {
    return (
        <div className="p-5 flex flex-col h-full animate-fade">
            <h2 className="text-3xl font-bold text-white mb-8">My Activity</h2>

            <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/10 h-12 p-1 mb-8">
                    <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white">Scan History</TabsTrigger>
                    <TabsTrigger value="favorites" className="rounded-md data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white">Favorite Dishes</TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-4">
                    {historyItems.length === 0 ? (
                        <div className="text-center py-20 text-white/40">No history yet.</div>
                    ) : (
                        historyItems.map(item => (
                            <Card
                                key={item.id}
                                onClick={() => onSelectHistoryItem(item)}
                                className="bg-white/10 backdrop-blur-md border-none text-white hover:bg-white/15 transition-all cursor-pointer overflow-hidden relative"
                            >
                                <div className="w-1.5 h-full bg-amber-400 absolute left-0 top-0" />
                                <CardContent className="p-5 pl-7">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold">{item.place}</h4>
                                        <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">{item.date}</span>
                                    </div>
                                    <p className="text-sm text-white/50 mb-3">{item.items}</p>
                                    <div className="text-xl font-bold text-amber-400">{item.total}</div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="favorites" className="space-y-4">
                    {favoriteItems.length === 0 ? (
                        <div className="text-center py-20 text-white/40">No favorite dishes yet.</div>
                    ) : (
                        favoriteItems.map(dish => (
                            <Card key={dish.id} className="bg-white/95 border-none shadow-sm rounded-2xl overflow-hidden active:scale-[0.98] transition-all">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-black">{dish.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                            <Home size={12} /> {dish.place}
                                        </p>
                                        <div className="text-green-600 font-bold text-lg mt-1">{dish.price}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleLike(dish)}
                                        className="rounded-full hover:bg-gray-100 text-red-500"
                                    >
                                        <Heart size={24} fill="currentColor" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default HistoryTab;
