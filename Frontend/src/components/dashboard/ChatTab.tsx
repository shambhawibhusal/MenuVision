import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
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

const preprocessText = (text: string) => {
    // Add double newlines before headers if they're preceded by a space and not already a newline
    // This handles models that sometimes forget to space out markdown headers
    return text
        .replace(/ ([#]+ )/g, '\n\n$1')
        .replace(/ ([*]{2})/g, '\n\n$1')
        .replace(/ ([-*] )/g, '\n\n$1')
        .replace(/(\d+\. )/g, '\n$1'); // Handle lists too
};

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
                            ? 'bg-white text-white rounded-tr-none'
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
