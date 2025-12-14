import React, { useState } from 'react';
import { DualLanguagePromptData } from '../types';
import { Copy, Check, Languages } from 'lucide-react';

interface JsonDisplayProps {
  data: DualLanguagePromptData;
}

type Language = 'japanese' | 'english';

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Language>('japanese');

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const currentData = data[activeLang];
  const { fullPrompt, ...structureData } = currentData;

  const TabButton = ({ lang, label }: { lang: Language; label: string }) => (
    <button
      onClick={() => setActiveLang(lang)}
      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeLang === lang
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header with Title and Tabs */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            Analysis Result
          </h3>
          <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800">
            <TabButton lang="japanese" label="JP 日本語" />
            <TabButton lang="english" label="EN English" />
          </div>
        </div>
        <div className="flex items-center text-xs text-indigo-400 font-medium">
          <Languages className="w-3 h-3 mr-1" />
          {activeLang === 'japanese' ? 'Natural Japanese' : 'Prompt English'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-6">
          {/* Main JSON Structure Block */}
          <div className="relative group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider">
                STRUCTURE DATA (FULL) - {activeLang === 'japanese' ? 'JP' : 'EN'}
              </label>
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

          {/* Separated Full Prompt Block */}
          <div className="relative group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider">
                FULL PROMPT (NARRATIVE) - {activeLang === 'japanese' ? 'JP' : 'EN'}
              </label>
              <button
                onClick={() => copyToClipboard(fullPrompt, 'rawFullPrompt')}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                {copiedField === 'rawFullPrompt' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'rawFullPrompt' ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <pre className="text-xs text-blue-300 font-mono bg-gray-950 p-4 rounded-lg overflow-x-auto border border-gray-800 whitespace-pre-wrap">
              {fullPrompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonDisplay;
