
import React, { useState } from 'react';
import { PromptData } from '../types';
import { Copy, Check } from 'lucide-react';

interface JsonDisplayProps {
  data: PromptData;
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const { fullPrompt, ...structureData } = data;

  // Medium Prompt: Extract specific fields from the structure data
  const mediumPromptData = {
    CORE_IDENTITY: data.CORE_IDENTITY,
    VISUAL_STYLE: data.VISUAL_STYLE,
    FACE_FEATURES: data.FACE_FEATURES,
    HAIR_STYLE: data.HAIR_STYLE,
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-800">
        <h3 className="font-semibold text-white">Analysis Result</h3>
        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
            Raw JSON
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-6">
             {/* Main JSON Structure Block (Status Quo) */}
             <div className="relative group">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider">Structure Data (Full)</label>
                    <button 
                        onClick={() => copyToClipboard(JSON.stringify(structureData, null, 2), 'jsonStructure')}
                        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                        {copiedField === 'jsonStructure' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'jsonStructure' ? 'Copied' : 'Copy JSON'}
                    </button>
                </div>
                <pre className="text-xs text-green-400 font-mono bg-gray-950 p-4 rounded-lg overflow-x-auto border border-gray-800">
                    {JSON.stringify(structureData, null, 2)}
                </pre>
            </div>

            {/* Medium Prompt Block (Subset of JSON) */}
            <div className="relative group">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider">Medium Prompt (Character Focus)</label>
                    <button 
                        onClick={() => copyToClipboard(JSON.stringify(mediumPromptData, null, 2), 'mediumPrompt')}
                        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                        {copiedField === 'mediumPrompt' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'mediumPrompt' ? 'Copied' : 'Copy JSON'}
                    </button>
                </div>
                <pre className="text-xs text-blue-300 font-mono bg-gray-950 p-4 rounded-lg overflow-x-auto border border-gray-800">
                    {JSON.stringify(mediumPromptData, null, 2)}
                </pre>
            </div>
        </div>
      </div>
    </div>
  );
};

export default JsonDisplay;
