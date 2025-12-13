
import React, { useState, useRef } from 'react';
import { analyzeImageToJSON, generatePoseImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import JsonDisplay from './components/JsonDisplay';
import PoseDisplay from './components/PoseDisplay';
import { DualLanguagePromptData, AppState } from './types';
import { Loader2, X, Code2, ImageIcon, FileJson, Save, CheckCircle, Wand2, MessageSquare, UserCircle2 } from 'lucide-react';

// ★★★ ここにGASのURLを貼り付けてください ★★★
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx5htiLmL8Fk8r45bVm9byWl-EmYo7mshJkj-wijdpo2E63RrVXn3dXu2DfEuGlrqOX/exec';

const App: React.FC = () => {
  // Logic states
  const [jsonState, setJsonState] = useState<AppState>(AppState.IDLE);
  const [promptData, setPromptData] = useState<DualLanguagePromptData | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [poseState, setPoseState] = useState<AppState>(AppState.IDLE);
  // Restored: Two pose images
  const [detailedPose, setDetailedPose] = useState<string | null>(null);
  const [abstractPose, setAbstractPose] = useState<string | null>(null);
  const [poseError, setPoseError] = useState<string | null>(null);

  // Notion state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Input state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // Pose Source
  const [faceRefImage, setFaceRefImage] = useState<string | null>(null); // Face Reference
  const [userInstructions, setUserInstructions] = useState<string>("");
  
  // Refs for mini uploader focus
  const miniFaceRef = useRef<HTMLDivElement>(null);

  const hasAnalysisStarted = jsonState !== AppState.IDLE || poseState !== AppState.IDLE || promptData !== null;

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

  const handleImageSelect = (base64: string) => {
    // Just set the image, do not run analysis yet
    // Do not clear everything if just changing the image, user might want to swap
    setUploadedImage(base64);
  };

  const handleFaceRefSelect = (base64: string) => {
    setFaceRefImage(base64);
  };

  const handleMiniPasteClick = async () => {
    miniFaceRef.current?.focus();
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            const imageType = item.types.find(type => type.startsWith('image/'));
            if (imageType) {
                const blob = await item.getType(imageType);
                const reader = new FileReader();
                reader.onload = (evt) => {
                    if (typeof evt.target?.result === 'string') {
                        setFaceRefImage(evt.target.result);
                    }
                };
                reader.readAsDataURL(blob);
                return;
            }
        }
    } catch (e) {
        // Fallback for no permission or support
    }
  };

  const handleMiniPasteEvent = (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => typeof reader.result === 'string' && setFaceRefImage(reader.result);
            reader.readAsDataURL(file);
          }
        }
      }
  };

  const handleExecute = async () => {
    if (!uploadedImage) return;

    // Reset results
    setPromptData(null);
    setDetailedPose(null);
    setAbstractPose(null);
    setJsonError(null);
    setPoseError(null);
    setSaveStatus('idle');

    // Determine aspect ratio
    const aspectRatio = await getAspectRatio(uploadedImage);

    // Trigger processes with user instructions
    runJsonAnalysis(uploadedImage, userInstructions);
    runPoseGeneration(uploadedImage, aspectRatio, userInstructions, faceRefImage);
  };

  const runJsonAnalysis = async (image: string, instructions: string) => {
    setJsonState(AppState.ANALYZING);
    try {
      const data = await analyzeImageToJSON(image, instructions);
      setPromptData(data);
      setJsonState(AppState.REVIEW);
    } catch (err) {
      console.error(err);
      setJsonError("Failed to analyze image.");
      setJsonState(AppState.IDLE);
    }
  };

  const runPoseGeneration = async (image: string, aspectRatio: string, instructions: string, faceImage: string | null) => {
    setPoseState(AppState.ANALYZING);
    try {
      // Run BOTH detailed and abstract generations in parallel
      const detailedPromise = generatePoseImage(image, aspectRatio, 'detailed', instructions, faceImage);
      const abstractPromise = generatePoseImage(image, aspectRatio, 'abstract', instructions, faceImage);

      const [detailedResult, abstractResult] = await Promise.all([detailedPromise, abstractPromise]);

      setDetailedPose(detailedResult);
      setAbstractPose(abstractResult);
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
        ...promptData.japanese, 
        english_analysis: promptData.english,
        imageData: uploadedImage,
        faceRefData: faceRefImage,
        userInstructions: userInstructions,
        // Optional: you might want to send the generated pose images too if your GAS handles it
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

  const reset = (clearInputs = true) => {
    if (clearInputs) {
        setUploadedImage(null);
        setFaceRefImage(null);
        setUserInstructions("");
    }
    setPromptData(null);
    setDetailedPose(null);
    setAbstractPose(null);
    setJsonState(AppState.IDLE);
    setPoseState(AppState.IDLE);
    setJsonError(null);
    setPoseError(null);
    setSaveStatus('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (uploadedImage && !isAnalyzing) {
        handleExecute();
      }
    }
  };

  const isAnalyzing = jsonState === AppState.ANALYZING || poseState === AppState.ANALYZING;

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
                <button onClick={() => reset(true)} className="text-sm text-gray-400 hover:text-white transition-colors">
                    Reset All
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6 overflow-hidden">
        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* Col 1: Source Images & Instructions */}
            <div className="flex flex-col gap-4 h-full min-h-0">
                <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-xs flex items-center justify-center border border-gray-700">1</span>
                    Source & Instructions
                </h2>

                {/* --- Top Area: Pose Source Image --- */}
                <div className={`flex flex-col ${hasAnalysisStarted ? 'flex-1 min-h-0' : 'h-1/2'}`}>
                     <label className="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-2">Pose Source</label>
                    {!uploadedImage ? (
                        <div className="h-full">
                            <ImageUploader onImageSelected={handleImageSelect} className="h-full" label="Paste Pose Reference" />
                        </div>
                    ) : (
                        <div className="relative group rounded-xl overflow-hidden border border-gray-800 bg-gray-900 w-full flex-1 flex items-start justify-center p-4">
                            <img src={uploadedImage} alt="Pose Source" className="max-w-full max-h-full object-contain" />
                            <button 
                                onClick={() => setUploadedImage(null)} 
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                title="Change Image"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                 {/* --- Middle Area: Face Reference (Only visible here BEFORE analysis) --- */}
                 {!hasAnalysisStarted && (
                     <div className="h-1/3 flex flex-col">
                        <label className="text-xs text-pink-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                             Face Reference <span className="text-gray-600 font-normal lowercase">(optional)</span>
                        </label>
                        {!faceRefImage ? (
                            <div className="h-full">
                                <ImageUploader 
                                    onImageSelected={handleFaceRefSelect} 
                                    className="h-full" 
                                    label="Paste Face Reference" 
                                />
                            </div>
                        ) : (
                            <div className="relative group rounded-xl overflow-hidden border border-gray-800 bg-gray-900 w-full flex-1 flex items-center justify-center p-4">
                                <img src={faceRefImage} alt="Face Ref" className="max-w-full max-h-full object-contain" />
                                <button 
                                    onClick={() => setFaceRefImage(null)} 
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                     </div>
                 )}

                {/* --- Bottom Area: Instructions & Face Ref (Small) & Execute --- */}
                <div className={`flex flex-col gap-2 ${hasAnalysisStarted ? 'h-auto' : 'flex-none'}`}>
                     <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        <span>Instructions</span>
                    </div>
                    
                    <div className="flex gap-2 h-24">
                         {/* Mini Face Ref Display (Visible here AFTER analysis) */}
                         {hasAnalysisStarted && (
                            <div 
                                ref={miniFaceRef}
                                tabIndex={0}
                                onClick={handleMiniPasteClick}
                                onPaste={handleMiniPasteEvent}
                                className="w-24 bg-gray-900 border border-gray-800 rounded-xl relative group shrink-0 overflow-hidden flex items-center justify-center cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all"
                            >
                                {faceRefImage ? (
                                    <>
                                        <img src={faceRefImage} alt="Face Ref" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setFaceRefImage(null); }} 
                                            className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-0 w-full bg-black/70 text-[10px] text-center text-pink-300 py-0.5">Face Ref</div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-600 gap-1 pointer-events-none">
                                         <UserCircle2 className="w-6 h-6" />
                                         <span className="text-[9px]">Click & Paste</span>
                                    </div>
                                )}
                            </div>
                         )}

                        <textarea 
                            value={userInstructions}
                            onChange={(e) => setUserInstructions(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="例：髪型をショートボブに変更して。（Cmd/Ctrl + Enter）"
                            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>
                    
                    <button
                        onClick={handleExecute}
                        disabled={!uploadedImage || isAnalyzing}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                            ${!uploadedImage 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : isAnalyzing
                                    ? 'bg-indigo-900/50 text-indigo-300 cursor-wait'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            }`}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                <span>Generate / Analyze</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Col 2: JSON Analysis */}
            <div className="flex flex-col gap-4 h-full min-h-0">
                 <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-xs flex items-center justify-center border border-gray-700">2</span>
                    Analysis (Modified)
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
                             <p className="text-gray-400">Incorporating instructions...</p>
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

            {/* Col 3: Visual Generation (Dual Pose) */}
            <div className="flex flex-col gap-4 h-full min-h-0">
                <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-gray-800 text-xs flex items-center justify-center border border-gray-700">3</span>
                    Pose Line Art {faceRefImage && <span className="text-pink-400 ml-1 text-xs font-normal">(Face Swapped)</span>}
                </h2>
                
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {poseError ? (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3 shrink-0">
                            <X className="w-5 h-5 flex-shrink-0" />
                            <p>{poseError}</p>
                        </div>
                    ) : poseState === AppState.ANALYZING ? (
                        <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/50 flex flex-col items-center justify-center text-center p-8">
                             <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                             <p className="text-gray-400">Generating sketches...</p>
                             {faceRefImage && <p className="text-pink-400 text-xs mt-2">Injecting Face Reference...</p>}
                        </div>
                    ) : detailedPose || abstractPose ? (
                        <>
                            {/* Detailed Pose (Top Half) */}
                            <div className="h-1/2 min-h-0 flex flex-col">
                                {detailedPose ? (
                                    <PoseDisplay 
                                        imageUrl={detailedPose} 
                                        title={faceRefImage ? "Detailed Pose (Likeness)" : "Detailed Pose"} 
                                        className="h-full"
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                                    </div>
                                )}
                            </div>

                            {/* Abstract Pose (Bottom Half) */}
                            <div className="h-1/2 min-h-0 flex flex-col">
                                {abstractPose ? (
                                    <PoseDisplay 
                                        imageUrl={abstractPose} 
                                        title="Abstract Pose (Structure)" 
                                        className="h-full"
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                                    </div>
                                )}
                            </div>
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
