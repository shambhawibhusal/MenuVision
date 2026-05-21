import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { MessageSquare, Menu, Plus, Check, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatMessage, ScannedItem } from '@/types/dashboard';
import MenuCard from '@/components/dashboard/MenuCard';

interface ChatTabProps {
    chatMessages: ChatMessage[];
    chatInput: string;
    setChatInput: (v: string) => void;
    sendMessage: () => void;
    chatLoading?: boolean;
    sessionsLoading?: boolean;
    onDishClick?: (item: ScannedItem) => void;
    userAllergens?: string[];
    onToggleSidebar: () => void;
    sessionTitle: string;
    onRenameSession: (title: string) => void;
    onNewSession: () => void;
    dishViewCounts?: Record<string, number>;
}

const preprocessText = (text: string) => {
    return text
        .replace(/ ([#]+ )/g, '\n\n$1')
        .replace(/ ([*]{2})/g, '\n\n$1')
        .replace(/ ([-*] )/g, '\n\n$1')
        .replace(/(\d+\. )/g, '\n$1');
};

const ChatTab: React.FC<ChatTabProps> = ({
    chatMessages,
    chatInput,
    setChatInput,
    sendMessage,
    chatLoading,
    sessionsLoading,
    onDishClick,
    userAllergens,
    onToggleSidebar,
    sessionTitle,
    onRenameSession,
    onNewSession,
    dishViewCounts = {},
}) => {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(sessionTitle);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);

    useEffect(() => {
        setTitleDraft(sessionTitle);
    }, [sessionTitle]);

    useEffect(() => {
        if (editingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [editingTitle]);

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const threshold = 150;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        setIsNearBottom(nearBottom);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleTitleSubmit = () => {
        const trimmed = titleDraft.trim();
        if (trimmed && trimmed !== sessionTitle) {
            onRenameSession(trimmed);
        }
        setEditingTitle(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] animate-fade">
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100">
                <button
                    onClick={onToggleSidebar}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
                    title="Chat history"
                >
                    <Menu size={20} />
                </button>

                <div className="flex-1 min-w-0 flex items-center justify-center">
                    {editingTitle ? (
                        <div className="flex items-center gap-1 max-w-[200px]">
                            <input
                                ref={titleInputRef}
                                value={titleDraft}
                                onChange={e => setTitleDraft(e.target.value)}
                                onBlur={handleTitleSubmit}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleTitleSubmit();
                                    if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(sessionTitle); }
                                }}
                                className="text-sm font-semibold text-black text-center bg-transparent border-b border-black outline-none w-full py-0.5"
                            />
                            <button onMouseDown={e => { e.preventDefault(); handleTitleSubmit(); }} className="shrink-0 text-green-600 hover:text-green-700">
                                <Check size={16} />
                            </button>
                            <button onMouseDown={e => { e.preventDefault(); setEditingTitle(false); setTitleDraft(sessionTitle); }} className="shrink-0 text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setEditingTitle(true)}
                            className="text-sm font-semibold text-black truncate max-w-[180px] hover:opacity-70 transition-opacity"
                            title="Tap to rename"
                        >
                            {sessionTitle}
                        </button>
                    )}
                </div>

                <button
                    onClick={onNewSession}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600 shrink-0"
                    title="New chat"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 p-5 overflow-y-auto space-y-4 relative">
                {sessionsLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs">Loading messages...</span>
                    </div>
                ) : (
                <>
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`max-w-[85%] flex ${msg.sender === 'user' ? 'justify-end ml-auto' : 'justify-start mr-auto'}`}>
                        <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.sender === 'user'
                            ? 'bg-white text-black rounded-tr-none'
                            : 'bg-white text-black border border-gray-100 rounded-tl-none'
                            }`}>
                            {msg.sender === 'bot' && msg.imageUrl && (
                                <div className="mb-3 -mx-1">
                                    <img
                                        src={msg.imageUrl}
                                        alt="Dish"
                                        className="w-full rounded-xl object-cover max-h-44 transition-opacity duration-300"
                                        style={{ opacity: 1 }}
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                            )}
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-inherit" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-md font-bold mb-2 mt-3 first:mt-0 text-inherit" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0 text-inherit" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2 text-inherit" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2 text-inherit" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-1 text-inherit" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-inherit whitespace-pre-wrap" {...props} />,
                                        code: ({ node, ...props }) => (
                                            <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 font-mono text-xs" {...props} />
                                        ),
                                        pre: ({ node, ...props }) => (
                                            <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto my-2 font-mono text-xs" {...props} />
                                        ),
                                        strong: ({ node, ...props }) => <strong className="font-bold text-inherit" {...props} />,
                                    }}
                                >
                                    {msg.sender === 'bot' ? preprocessText(msg.text) : msg.text}
                                </ReactMarkdown>
                            </div>
                            {msg.sender === 'bot' && msg.dishes && msg.dishes.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    <SeparatorDots />
                                    {msg.dishes.map((dish, i) => (
                                        <MenuCard
                                            key={i}
                                            item={dish}
                                            onClick={() => onDishClick?.(dish)}
                                            userAllergens={userAllergens}
                                            viewCount={(() => { const rid = `${dish.place || ''}_${dish.location || ''}`; return dishViewCounts[`${rid}|${dish?.datasetId || ''}`] || 0; })()}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {chatLoading && (
                    <div className="flex justify-start mr-auto max-w-[85%]">
                        <div className="p-4 rounded-2xl bg-white border border-gray-100 rounded-tl-none">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />

                {!isNearBottom && (
                    <div className="sticky bottom-6 flex justify-end">
                        <button
                            onClick={scrollToBottom}
                            className="w-10 h-10 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all z-10"
                            title="Scroll to newest message"
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>
                )}
                </>
                )}
            </div>

            <Card className="rounded-none border-x-0 border-b-0 shadow-none p-3 bg-white">
                <div className="flex gap-2">
                    <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask anything about food..."
                        className="flex-1 border-gray-200 h-12 rounded-xl focus-visible:ring-black"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={chatLoading}
                    />
                    <Button onClick={sendMessage} disabled={chatLoading} className="bg-black hover:bg-gray-800 text-white rounded-xl w-12 h-12 p-0 disabled:opacity-50">
                        <MessageSquare size={20} />
                    </Button>
                </div>
            </Card>
        </div>
    );
};

const SeparatorDots = () => (
    <div className="flex items-center gap-1.5 py-1">
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span className="w-1 h-1 rounded-full bg-gray-300" />
    </div>
);

export default ChatTab;
