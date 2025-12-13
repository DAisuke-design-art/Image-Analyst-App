import React, { useState } from 'react';
import { ClipboardCopy } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  className?: string;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, className = "", label = "Paste Image" }) => {
  const [isFocused, setIsFocused] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
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

  return (
    <div
      className={`relative w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group outline-none
        ${isFocused ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/50" : "border-gray-700 hover:border-indigo-400 hover:bg-gray-800/50"}
        ${className}`}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPaste={handlePaste}
    >
      <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-white transition-colors pointer-events-none select-none">
        <div className={`p-4 rounded-full transition-colors ${isFocused ? "bg-indigo-600 text-white" : "bg-gray-800 group-hover:bg-indigo-600"}`}>
          <ClipboardCopy className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-medium text-indigo-400">{label}</p>
          <p className="text-sm mt-1">Click here & Press <span className="font-bold border border-gray-600 rounded px-1 text-xs">Cmd/Ctrl + V</span></p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;