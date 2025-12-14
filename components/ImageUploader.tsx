
import React, { useRef, useState } from 'react';
import { ClipboardPaste, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  className?: string; // Allow overriding styles
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, className = "h-64", label = "Paste Image" }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    // Prevent default paste behavior if needed, though usually fine for div
    const items = e.clipboardData.items;
    let found = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          found = true;
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (typeof evt.target?.result === 'string') {
              onImageSelected(evt.target.result);
              setError(null);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
    
    if (!found) {
       // Only show error if paste happened but no image was found
       if (items.length > 0) {
         setError("No image found in clipboard");
         setTimeout(() => setError(null), 2000);
       }
    }
  };

  const handleClick = async () => {
    containerRef.current?.focus();
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
                const blob = await item.getType(imageType);
                const reader = new FileReader();
                reader.onload = (evt) => {
                    if (typeof evt.target?.result === 'string') {
                        onImageSelected(evt.target.result);
                        setError(null);
                    }
                };
                reader.readAsDataURL(blob);
                return;
            }
        }
    } catch (e) {
        // Fallback: The focus is set, user can Ctrl+V
        // console.debug("Clipboard API not available or denied, waiting for Ctrl+V");
    }
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPaste={handlePaste}
      onClick={handleClick}
      className={`relative w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all cursor-pointer outline-none ${
        isFocused 
          ? 'border-indigo-500 bg-gray-800/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
          : 'border-gray-700 bg-gray-900/30 hover:bg-gray-800/30'
      } ${className}`}
    >
      <div className={`flex flex-col items-center gap-3 pointer-events-none transition-colors ${isFocused ? 'text-gray-300' : 'text-gray-500'}`}>
        <div className={`p-3 rounded-full transition-colors ${isFocused ? 'bg-indigo-900/30 text-indigo-400' : 'bg-gray-800/50 text-gray-400'}`}>
           <ClipboardPaste className="w-6 h-6" />
        </div>
        <div className="text-center px-2">
            <p className={`font-medium text-sm transition-colors ${isFocused ? 'text-white' : 'text-gray-300'}`}>{label}</p>
            <p className={`text-xs mt-1 transition-colors ${isFocused ? 'text-indigo-300 font-medium' : 'text-gray-500'}`}>
                {isFocused ? "Press Ctrl+V to Paste" : "Click to Focus & Paste"}
            </p>
        </div>
      </div>
      
      {error && (
        <div className="absolute bottom-4 bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-3 h-3" />
            {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
