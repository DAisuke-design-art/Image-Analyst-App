import React from 'react';
import { selectApiKey } from '../services/geminiService';
import { Key, ExternalLink } from 'lucide-react';

interface ApiKeyWallProps {
  onKeySelected: () => void;
}

const ApiKeyWall: React.FC<ApiKeyWallProps> = ({ onKeySelected }) => {
  const handleConnect = async () => {
    await selectApiKey();
    // Assuming success if the dialog closes and we proceed (mitigating race condition by optimistic update or parent check)
    onKeySelected();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl max-w-md w-full">
        <div className="bg-indigo-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Authentication Required</h2>
        <p className="text-gray-400 mb-8">
          To use <strong>Gemini 3.0 Pro Image</strong>, you must connect a paid Google Cloud Project with the Gemini API enabled.
        </p>
        
        <button
          onClick={handleConnect}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          Connect Project
        </button>

        <div className="mt-6 pt-6 border-t border-gray-800">
           <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-indigo-400 flex items-center justify-center gap-1 transition-colors"
          >
            Learn more about billing <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyWall;