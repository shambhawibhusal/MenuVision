import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { HistoryItem } from '@/types/dashboard';

interface HistoryTabProps {
    historyItems: HistoryItem[];
}

const HistoryTab: React.FC<HistoryTabProps> = ({ historyItems }) => {
    return (
        <div className="p-5 flex flex-col h-full animate-fade">
            <h2 className="text-3xl font-bold text-white mb-8">History</h2>
            <div className="space-y-4">
                {historyItems.map(item => (
                    <Card key={item.id} className="bg-white/10 backdrop-blur-md border-none text-white hover:bg-white/15 transition-all cursor-pointer overflow-hidden">
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
                ))}
            </div>
        </div>
    );
};

export default HistoryTab;
