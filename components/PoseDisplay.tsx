
import React from 'react';
import { Download } from 'lucide-react';

interface PoseDisplayProps {
  imageUrl: string;
  title?: string;
}

const PoseDisplay: React.FC<PoseDisplayProps> = ({ imageUrl, title = "Pose Extraction" }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden min-h-[300px]">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-800">
        <h3 className="font-semibold text-white">{title}</h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>

      <div className="flex-1 p-4 flex items-center justify-center bg-gray-950/50">
        <div className="relative w-full h-full flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
          <img 
            src={imageUrl} 
            alt={title} 
            className="max-w-full max-h-[400px] object-contain rounded-lg shadow-2xl border border-gray-800"
          />
        </div>
      </div>
    </div>
  );
};

export default PoseDisplay;
