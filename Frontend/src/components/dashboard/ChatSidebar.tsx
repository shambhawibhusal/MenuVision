import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { ChatSession } from '@/types/dashboard';

interface ChatSidebarProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onNewSession: () => void;
    onSelectSession: (sessionId: string) => void;
    onRenameSession: (sessionId: string, title: string) => void;
    onDeleteSession: (sessionId: string) => void;
}

const formatRelativeTime = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    sessions,
    activeSessionId,
    isOpen,
    onClose,
    onNewSession,
    onSelectSession,
    onRenameSession,
    onDeleteSession,
}) => {
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameText, setRenameText] = useState('');
    const renameInputRef = useRef<HTMLInputElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (renamingId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuOpenId && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpenId]);

    const handleRenameSubmit = (sessionId: string) => {
        const trimmed = renameText.trim();
        if (trimmed) {
            onRenameSession(sessionId, trimmed);
        }
        setRenamingId(null);
    };

    const startRenaming = (session: ChatSession) => {
        setRenameText(session.title);
        setRenamingId(session.id);
        setMenuOpenId(null);
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <div
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-xl transform transition-transform duration-300 ease-out flex flex-col ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg font-semibold text-black tracking-tight">Chats</h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => { onNewSession(); onClose(); }}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                            title="New chat"
                        >
                            <Plus size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                    {sessions.length === 0 && (
                        <div className="px-4 py-8 text-center text-gray-400 text-sm">
                            <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
                            <p>No conversations yet</p>
                            <p className="mt-1 text-xs">Start a new chat to begin</p>
                        </div>
                    )}

                    {sessions.map(session => (
                        <div key={session.id} className="relative group">
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    if (renamingId !== session.id) {
                                        onSelectSession(session.id);
                                        onClose();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        if (renamingId !== session.id) {
                                            onSelectSession(session.id);
                                            onClose();
                                        }
                                    }
                                }}
                                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-gray-50 cursor-pointer ${
                                    activeSessionId === session.id ? 'bg-gray-100' : ''
                                }`}
                            >
                                <MessageSquare
                                    size={18}
                                    className={`mt-0.5 shrink-0 ${
                                        activeSessionId === session.id ? 'text-black' : 'text-gray-400'
                                    }`}
                                />
                                <div className="min-w-0 flex-1">
                                    {renamingId === session.id ? (
                                        <input
                                            ref={renameInputRef}
                                            value={renameText}
                                            onChange={e => setRenameText(e.target.value)}
                                            onBlur={() => handleRenameSubmit(session.id)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleRenameSubmit(session.id);
                                                if (e.key === 'Escape') setRenamingId(null);
                                            }}
                                            className="w-full text-sm font-medium text-black bg-transparent border-b border-black outline-none py-0.5"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-black truncate">
                                            {session.title}
                                        </p>
                                    )}
                                    {session.lastMessage && (
                                        <p className="text-xs text-gray-400 truncate mt-0.5">
                                            {session.lastMessage}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-gray-300 mt-1">
                                        {session.messageCount} messages · {formatRelativeTime(session.updatedAt)}
                                    </p>
                                </div>

                                <div className="relative shrink-0">
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === session.id ? null : session.id);
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-400"
                                    >
                                        <MoreHorizontal size={15} />
                                    </button>

                                    {menuOpenId === session.id && (
                                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10 min-w-[120px] animate-fade">
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    startRenaming(session);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Pencil size={13} /> Rename
                                            </button>
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setMenuOpenId(null);
                                                    onDeleteSession(session.id);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default ChatSidebar;
