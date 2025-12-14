
import React, { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';

interface PoseDisplayProps {
  imageUrl: string;
  title?: string;
  className?: string;
}

const PoseDisplay: React.FC<PoseDisplayProps> = ({ imageUrl, title = "Pose Extraction", className = "" }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    try {
      // Convert Data URL to Blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Write to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy image:", err);
      alert("クリップボードへのコピーに失敗しました。");
    }
  };

  return (
    <div className={`flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-800 shrink-0">
        <h3 className="font-semibold text-white text-sm">{title}</h3>
        <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all font-medium border
                ${copied 
                  ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-medium border border-transparent"
            >
              <Download className="w-3 h-3" />
            </button>
        </div>
      </div>

      <div className="flex-1 p-2 flex items-center justify-center bg-gray-950/50 min-h-0">
        <div className="relative w-full h-full flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
          <img 
            src={imageUrl} 
            alt={title} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-gray-800"
          />
        </div>
      </div>
    </div>
  );
};

export default PoseDisplay;
