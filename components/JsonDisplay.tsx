
import React, { useState, useEffect } from 'react';
import { PromptData } from '../types';
import { Copy, Check } from 'lucide-react';

interface JsonDisplayProps {
  data: PromptData;
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
  // We keep a local editable version of the full prompt
  const [editablePrompt, setEditablePrompt] = useState(data.fullPrompt);
  const [activeTab, setActiveTab] = useState<'json' | 'preview'>('preview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setEditablePrompt(data.fullPrompt);
  }, [data]);

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderField = (label: string, value: string) => (
    <div className="p-3 bg-gray-950 rounded-lg border border-gray-800 break-words">
      <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider block mb-1">{label}</label>
      <p className="text-gray-300 text-sm">{value || "N/A"}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-800">
        <h3 className="font-semibold text-white">Analysis Result</h3>
        <div className="flex bg-gray-900 rounded-lg p-1">
            <button 
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Fields
            </button>
            <button 
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 text-sm rounded-md transition-all ${activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Raw JSON
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'preview' ? (
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderField("Subject", data.subject)}
                    {renderField("Style", data.style)}
                    {renderField("Clothing", data.clothing)}
                    {renderField("Hair", data.hair)}
                    {renderField("Face", data.face)}
                    {renderField("Accessories", data.accessories)}
                    {renderField("Environment", data.environment)}
                    {renderField("Lighting", data.lighting)}
                    {renderField("Camera", data.camera)}
                    
                    {/* Compact fields for static info */}
                    <div className="grid grid-cols-2 gap-3 md:col-span-2 lg:col-span-1">
                        {renderField("Aspect Ratio", data.aspect_ratio)}
                        {renderField("Orientation", data.orientation)}
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider block">
                            Full Description (Editable)
                        </label>
                        <button 
                            onClick={() => copyToClipboard(editablePrompt, 'fullPrompt')}
                            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        >
                            {copiedField === 'fullPrompt' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedField === 'fullPrompt' ? 'Copied' : 'Copy Text'}
                        </button>
                    </div>
                    <textarea 
                        value={editablePrompt}
                        onChange={(e) => setEditablePrompt(e.target.value)}
                        className="w-full h-40 bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    />
                </div>
             </div>
        ) : (
            <div className="relative">
                <button 
                    onClick={() => copyToClipboard(JSON.stringify(data, null, 2), 'json')}
                    className="absolute top-2 right-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors z-10"
                >
                    {copiedField === 'json' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'json' ? 'Copied' : 'Copy JSON'}
                </button>
                <pre className="text-xs text-green-400 font-mono bg-gray-950 p-4 pt-10 rounded-lg overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        )}
      </div>
    </div>
  );
};

export default JsonDisplay;
