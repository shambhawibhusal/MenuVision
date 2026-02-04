import React from 'react';
import { MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatMessage } from '@/types/dashboard';

interface ChatTabProps {
    chatMessages: ChatMessage[];
    chatInput: string;
    setChatInput: (v: string) => void;
    sendMessage: () => void;
}

const ChatTab: React.FC<ChatTabProps> = ({
    chatMessages,
    chatInput,
    setChatInput,
    sendMessage
}) => {
    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] animate-fade">
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`max-w-[85%] flex ${msg.sender === 'user' ? 'justify-end ml-auto' : 'justify-start mr-auto'}`}>
                        <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.sender === 'user'
                            ? 'bg-black text-white rounded-tr-none'
                            : 'bg-white text-black border border-gray-100 rounded-tl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <Card className="rounded-none border-x-0 border-b-0 shadow-none p-3 bg-white">
                <div className="flex gap-2">
                    <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask anything about food..."
                        className="flex-1 border-gray-200 h-12 rounded-xl focus-visible:ring-black"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} className="bg-black hover:bg-gray-800 text-white rounded-xl w-12 h-12 p-0">
                        <MessageSquare size={20} />
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ChatTab;
