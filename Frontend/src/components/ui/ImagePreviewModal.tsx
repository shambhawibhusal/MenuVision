import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    alt: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl, alt }) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="max-w-[100vw] w-[100vw] h-[100vh] p-0 bg-transparent backdrop-blur-md border-none rounded-none">
                <DialogTitle className="sr-only">{alt || 'Image preview'}</DialogTitle>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                    <X size={32} />
                </button>
                <div
                    className="w-full h-full flex items-center justify-center p-1"
                    onClick={onClose}
                >
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={alt}
                            className="w-auto h-full max-w-[90vw] object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImagePreviewModal;