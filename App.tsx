
import React, { useState } from 'react';
import { analyzeImageToJSON, generatePoseImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import JsonDisplay from './components/JsonDisplay';
import PoseDisplay from './components/PoseDisplay';
import { PromptData, AppState } from './types';
import { Loader2, X, Code2, ImageIcon, FileJson, Save, CheckCircle } from 'lucide-react';

// ★★★ ここにGASのURLを貼り付けてください ★★★
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx5htiLmL8Fk8r45bVm9byWl-EmYo7mshJkj-wijdpo2E63RrVXn3dXu2DfEuGlrqOX/exec';

const App: React.FC = () => {
  // Logic states
  const [jsonState, setJsonState] = useState<AppState>(AppState.IDLE);
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [poseState, setPoseState] = useState<AppState>(AppState.IDLE);
  const [poseImages, setPoseImages] = useState<{detailed: string | null, abstract: string | null}>({detailed: null, abstract: null});
  const [poseError, setPoseError] = useState<string | null>(null);

  // Notion state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Input state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Helper to estimate aspect ratio bucket for Gemini API
  const getAspectRatio = async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        // Buckets: 1:1, 3:4, 4:3, 9:16, 16:9
        if (Math.abs(ratio - 1) < 0.15) resolve("1:1");
        else if (ratio > 1.6) resolve("16:9");
        else if (ratio > 1.2) resolve("4:3");
        else if (ratio < 0.65) resolve("9:16");
        else if (ratio < 0.85) resolve("3:4");
        else resolve("1:1"); // Default fallback
      };
      img.src = base64;
    });
  };

  const handleImageSelect = async (base64: string) => {
    // 1. Reset all states
    setPromptData(null);
    setPoseImages({detailed: null, abstract: null});
    setJsonError(null);
    setPoseError(null);
    setJsonState(AppState.IDLE);
    setPoseState(AppState.IDLE);
    setSaveStatus('idle');
    setUploadedImage(base64);

    // 2. Determine aspect ratio
    const aspectRatio = await getAspectRatio(base64);

    // 3. Trigger processes
    runJsonAnalysis(base64);
    runPoseGeneration(base64, aspectRatio);
  };

  const runJsonAnalysis = async (image: string) => {
    setJsonState(AppState.ANALYZING);
    try {
      const data = await analyzeImageToJSON(image);
      setPromptData(data);
      setJsonState(AppState.REVIEW);
    } catch (err) {
      console.error(err);
      setJsonError("Failed to analyze image.");
      setJsonState(AppState.IDLE);
    }
  };

  const runPoseGeneration = async (image: string, aspectRatio: string) => {
    setPoseState(AppState.ANALYZING);
    try {
      // Run both generations in parallel
      const [detailed, abstract] = await Promise.all([
        generatePoseImage(image, aspectRatio, 'detailed'),
        generatePoseImage(image, aspectRatio, 'abstract')
      ]);

      setPoseImages({ detailed, abstract });
      setPoseState(AppState.REVIEW);
    } catch (err) {
      console.error(err);
      setPoseError("Failed to generate pose.");
      setPoseState(AppState.IDLE);
    }
  };

  const saveToNotion = async () => {
    if (!promptData || isSaving) return;
    
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const payload = {
        ...promptData,
        imageData: uploadedImage 
      };

      const response = await fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        throw new Error(result.message || 'Unknown error from GAS');
      }
    } catch (error) {
      console.error("Notion Save Error:", error);
      setSaveStatus('error');
      alert("保存エラー: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setUploadedImage(null);
    setPromptData(null);
    setPoseImages({detailed: null, abstract: null});
    setJsonState(AppState.IDLE);
    setPoseState(AppState.IDLE);
    setJsonError(null);
    setPoseError(null);
    setSaveStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col h-screen overflow-hidden">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                  <Code2 className="w-5 h-5" />
                </div>
                <h1 className="font-bold text-xl tracking-tight">Image Analyst <span className="text-gray-500 text-sm font-normal ml-1">Gemini 3.0</span></h1>
            </div>
            <div className="flex items-center gap-4">
                 {/* Save Button */}
                 {promptData && (
                    <button
                        onClick={saveToNotion}
                        disabled={isSaving || saveStatus === 'success'}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all font-medium border
                            ${saveStatus === 'success' 
                            ? 'bg-green-500/10 border-green-500 text-green-400' 
                            : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : saveStatus === 'success' ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Saved!</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save to Notion</span>
                            </>
                        )}
                    </button>
                )}
                <button onClick={reset} className="text-sm text-gray-400 hover:text-white transition-colors">
                    New Analysis
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6 overflow-hidden">
        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* Col 1: Source Image */}
            <div className="flex flex-col gap-4 h-full min-h-0">
                <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-xs flex items-center justify-center border border-gray-700">1</span>
                    Source
                </h2>

                {!uploadedImage ? (
                    <div className="h-full">
                        <ImageUploader onImageSelected={handleImageSelect} />
                    </div>
                ) : (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-800 bg-gray-900 w-full flex-1 flex items-start justify-center p-4">
                        <img src={uploadedImage} alt="Source" className="max-w-full max-h-full object-contain" />
                        <button 
                            onClick={reset} 
                            className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                            title="Change Image"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Col 2: JSON Analysis */}
            <div className="flex flex-col gap-4 h-full min-h-0">
                 <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-xs flex items-center justify-center border border-gray-700">2</span>
                    Analysis
                </h2>
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    {jsonError ? (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
                            <X className="w-5 h-5 flex-shrink-0" />
                            <p>{jsonError}</p>
                        </div>
                    ) : jsonState === AppState.ANALYZING ? (
                        <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/50 flex flex-col items-center justify-center text-center p-8">
                             <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                             <p className="text-gray-400">Analyzing visual details...</p>
                        </div>
                    ) : promptData ? (
                        <JsonDisplay data={promptData} />
                    ) : (
                        <div className="flex-1 rounded-xl border-2 border-dashed border-gray-800 bg-gray-900/30 flex flex-col items-center justify-center text-center p-8 text-gray-600">
                            <FileJson className="w-12 h-12 mb-4 text-gray-700" />
                            <p>JSON Analysis will appear here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Col 3: Visual Generation (Pose Only) - Split View */}
            <div className="flex flex-col gap-4 h-full min-h-0">
                <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-xs flex items-center justify-center border border-gray-700">3</span>
                    Pose Line Art
                </h2>
                
                {/* Container for Split View */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {poseError ? (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3 shrink-0">
                            <X className="w-5 h-5 flex-shrink-0" />
                            <p>{poseError}</p>
                        </div>
                    ) : poseState === AppState.ANALYZING ? (
                        <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/50 flex flex-col items-center justify-center text-center p-8">
                             <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                             <p className="text-gray-400">Generating pose sketches...</p>
                        </div>
                    ) : (poseImages.detailed || poseImages.abstract) ? (
                        <>
                            {/* Top Half: Detailed */}
                            {poseImages.detailed && (
                                <PoseDisplay 
                                    imageUrl={poseImages.detailed} 
                                    title="Detailed Pose (Character)" 
                                    className="flex-1 min-h-0"
                                />
                            )}
                            {/* Bottom Half: Abstract */}
                            {poseImages.abstract && (
                                <PoseDisplay 
                                    imageUrl={poseImages.abstract} 
                                    title="Abstract Pose (Mannequin)" 
                                    className="flex-1 min-h-0"
                                />
                            )}
                        </>
                    ) : (
                         <div className="flex-1 rounded-xl border-2 border-dashed border-gray-800 bg-gray-900/30 flex flex-col items-center justify-center text-center p-8 text-gray-600">
                            <ImageIcon className="w-12 h-12 mb-4 text-gray-700" />
                            <p>Pose reference will appear here</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default App;
