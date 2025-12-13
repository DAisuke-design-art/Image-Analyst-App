
import React, { useState } from 'react';
import { DualLanguagePromptData } from '../types';
import { Copy, Check, Languages } from 'lucide-react';

interface JsonDisplayProps {
  data: DualLanguagePromptData;
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'japanese' | 'english'>('japanese');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeData = data[activeTab];
  const { fullPrompt, ...structureData } = activeData;
  
  // Extract Aspect Ratio from the active data and create the display text
  const aspectRatio = structureData.SCENE?.Aspect_Ratio;
  const textToDisplay = aspectRatio 
    ? `${fullPrompt}\n\n--ar ${aspectRatio}` 
    : fullPrompt;

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-white">Analysis Result</h3>
        </div>
        
        {/* Language Tabs */}
        <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
            <button
                onClick={() => setActiveTab('japanese')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'japanese'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
            >
                日本語
            </button>
            <button
                onClick={() => setActiveTab('english')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'english'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
            >
                English
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-6">
             {/* Main JSON Structure Block */}
             <div className="relative group">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider">Structure Data (Full) - {activeTab === 'japanese' ? 'JP' : 'EN'}</label>
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

            {/* Full Prompt Block (Text) */}
            <div className="relative group">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider">Full Prompt (Narrative) - {activeTab === 'japanese' ? 'JP' : 'EN'}</label>
                    <button 
                        onClick={() => copyToClipboard(textToDisplay, 'fullPrompt')}
                        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    >
                        {copiedField === 'fullPrompt' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'fullPrompt' ? 'Copied' : 'Copy Text'}
                    </button>
                </div>
                <div className="text-sm text-blue-200 bg-gray-950 p-4 rounded-lg border border-gray-800 whitespace-pre-wrap leading-relaxed">
                    {textToDisplay}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default JsonDisplay;
