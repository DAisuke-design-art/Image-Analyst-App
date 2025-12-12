
import React, { useEffect } from 'react';
import { ClipboardPaste } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              processFile(file);
              return;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onImageSelected]);

  return (
    <div 
      className="relative w-full h-64 border-2 border-dashed border-gray-700 bg-gray-900/30 rounded-xl flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="p-4 rounded-full bg-gray-800/50">
           <ClipboardPaste className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-center">
            <p className="font-medium text-gray-300">Paste Image to Start</p>
            <p className="text-sm text-gray-500 mt-1">Ctrl + V / Cmd + V</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
