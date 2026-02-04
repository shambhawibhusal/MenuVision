import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
                    <div className="flex flex-col gap-4">
                        {scannedItems.length === 0 && <p className="text-white/60 text-center py-10">No items found.</p>}
                        {scannedItems.map((item, index) => (
                            <Card key={index} onClick={() => setSelectedDish(item)} className="cursor-pointer hover:bg-gray-50/10 border-none bg-white/10 backdrop-blur-md text-white transition-all">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">{item.name}</CardTitle>
                                        <span className="text-amber-400 font-bold">{item.price}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <p className="text-sm text-white/60 line-clamp-2">{item.description}</p>
                                </CardContent>
                            </Card>
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
