import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScannedItem, Tab } from '@/types/dashboard';

interface ResultsTabProps {
    viewMode: 'items' | 'text';
    setViewMode: (v: 'items' | 'text') => void;
    scannedItems: ScannedItem[];
    setSelectedDish: (item: ScannedItem) => void;
    fullText: string;
    setActiveTab: (t: Tab) => void;
}

import MenuCard from './MenuCard';

const ResultsTab: React.FC<ResultsTabProps> = ({
    viewMode,
    setViewMode,
    scannedItems,
    setSelectedDish,
    fullText,
    setActiveTab
}) => {
    return (
        <div className="p-5 flex flex-col h-full animate-fade">
            <h2 className="text-3xl font-bold text-white mb-6">Analysis Results</h2>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/20 h-12 p-1">
                    <TabsTrigger value="items" className="rounded-md data-[state=active]:bg-amber-400 data-[state=active]:text-black">Menu Items</TabsTrigger>
                    <TabsTrigger value="text" className="rounded-md data-[state=active]:bg-amber-400 data-[state=active]:text-black">Full Text</TabsTrigger>
                </TabsList>
                <TabsContent value="items" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {scannedItems.length === 0 && <p className="text-white/60 text-center py-10 col-span-full">No items found.</p>}
                        {scannedItems.map((item, index) => (
                            <MenuCard
                                key={index}
                                item={item}
                                onClick={() => setSelectedDish(item)}
                            />
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="text" className="mt-6">
                    <Card className="bg-white/10 backdrop-blur-md border-none text-white">
                        <CardContent className="p-6 whitespace-pre-wrap max-h-[50vh] overflow-y-auto leading-relaxed">
                            {fullText || "No text extracted."}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Button onClick={() => setActiveTab('home')} className="mt-auto mb-4 bg-amber-400 text-black hover:bg-amber-500 font-bold h-12 rounded-xl">
                Scan Another
            </Button>
        </div>
    );
};

export default ResultsTab;
