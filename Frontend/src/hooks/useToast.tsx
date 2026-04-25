import { useState, useCallback, useEffect } from 'react';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface UseToastReturn {
    toasts: Toast[];
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setToasts(prev => {
                const now = Date.now();
                return prev.filter(t => now - parseInt(t.id) < 4000);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return { toasts, showToast, removeToast };
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up ${
                        toast.type === 'success' ? 'bg-green-500 text-white' :
                        toast.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-gray-800 text-white'
                    }`}
                    onClick={() => onRemove(toast.id)}
                >
                    <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
                    <span className="font-medium">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}