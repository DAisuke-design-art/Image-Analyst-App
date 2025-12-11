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
  const [activeTab, setActiveTab] = useState<'json' | 'pose'>('json');
  
  const [jsonState, setJsonState] = useState<AppState>(AppState.IDLE);
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [poseState, setPoseState] = useState<AppState>(AppState.IDLE);
  const [poseImage, setPoseImage] = useState<string | null>(null);
  const [poseError, setPoseError] = useState<string | null>(null);

  // Notion保存用の状態
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageSelect = async (base64: string) => {
    setPromptData(null);
    setPoseImage(null);
    setJsonError(null);
    setPoseError(null);
    setJsonState(AppState.IDLE);
    setPoseState(AppState.IDLE);
    setSaveStatus('idle'); // リセット
    
    setUploadedImage(base64);

    if (activeTab === 'json') {
        analyzeJson(base64);
    }
  };

  const analyzeJson = async (image: string) => {
    if (jsonState === AppState.ANALYZING) return;
    setJsonState(AppState.ANALYZING);
    setJsonError(null);
    setSaveStatus('idle');
    try {
      const data = await analyzeImageToJSON(image);
      setPromptData(data);
      setJsonState(AppState.REVIEW);
    } catch (err) {
      console.error(err);
      setJsonError("Failed to analyze image. Please try again.");
      setJsonState(AppState.IDLE);
    }
  };

  const generatePose = async (image: string) => {
    if (poseState === AppState.ANALYZING) return;
    setPoseState(AppState.ANALYZING);
    setPoseError(null);
    try {
      const resultImage = await generatePoseImage(image);
      setPoseImage(resultImage);
      setPoseState(AppState.REVIEW);
    } catch (err) {
      console.error(err);
      setPoseError("Failed to generate pose image. Please try again.");
      setPoseState(AppState.IDLE);
    }
  };

  // ★ Notion保存機能
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
        headers: {
            // GASの仕様上、あえて単純なContent-Typeにする場合がありますが
            // 今回は標準的なJSON送信で、GAS側のdoPostで受け取ります
        },
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
      // エラー内容をアラートで表示（デバッグ用）
      alert("保存エラー: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setUploadedImage(null);
    setPromptData(null);
    setPoseImage(null);
    setJsonState(AppState.IDLE);
    setPoseState(AppState.IDLE);
    setJsonError(null);
    setPoseError(null);
    setSaveStatus('idle');
  };

  const handleTabChange = (tab: 'json' | 'pose') => {
    setActiveTab(tab);
    if (uploadedImage) {
        if (tab === 'json' && !promptData && jsonState === AppState.IDLE) {
            analyzeJson(uploadedImage);
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                  <Code2 className="w-5 h-5" />
                </div>
                <h1 className="font-bold text-xl tracking-tight">Image Analyst <span className="text-gray-500 text-sm font-normal ml-1">Gemini 3.0</span></h1>
            </div>
            <button onClick={reset} className="text-sm text-gray-400 hover:text-white transition-colors">
                New Analysis
            </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px]">
            {/* Left: Input */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-800 text-xs flex items-center justify-center border border-gray-700">1</span>
                        Source Image
                    </h2>
                    {uploadedImage && (
                        <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300">Change</button>
                    )}
                </div>

                {!uploadedImage ? (
                    <ImageUploader onImageSelected={handleImageSelect} />
                ) : (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-800 bg-gray-900 aspect-video lg:aspect-square flex items-center justify-center">
                        <img src={uploadedImage} alt="Source" className="max-w-full max-h-full object-contain" />
                        {(jsonState === AppState.ANALYZING || poseState === AppState.ANALYZING) && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                                <p className="text-indigo-200 font-medium">
                                    {jsonState === AppState.ANALYZING ? "Analyzing Visuals..." : "Generating Pose..."}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Output */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                     <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-800 text-xs flex items-center justify-center border border-gray-700">2</span>
                        Results
                    </h2>
                    
                    <div className="flex items-center gap-2">
                        {/* ★ ここに保存ボタンを追加しました ★ */}
                        {promptData && activeTab === 'json' && (
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

                        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 ml-2">
                            <button
                                onClick={() => handleTabChange('json')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all ${
                                    activeTab === 'json' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FileJson className="w-4 h-4" />
                                <span>Analysis</span>
                            </button>
                            <button
                                onClick={() => handleTabChange('pose')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all ${
                                    activeTab === 'pose' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <ImageIcon className="w-4 h-4" />
                                <span>Pose</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 min-h-[400px]">
                  {activeTab === 'json' && (
                    <>
                        {jsonError && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
                                <X className="w-5 h-5 flex-shrink-0" />
                                <p>{jsonError}</p>
                            </div>
                        )}
                        {promptData ? (
                            <JsonDisplay data={promptData} />
                        ) : (
                            <div className="h-full rounded-xl border-2 border-dashed border-gray-800 bg-gray-900/30 flex flex-col items-center justify-center text-center p-8 text-gray-600">
                                <Code2 className="w-12 h-12 mb-4 text-gray-700" />
                                <p>Upload an image to generate a structured JSON analysis.</p>
                                {uploadedImage && jsonState === AppState.IDLE && (
                                     <button onClick={() => analyzeJson(uploadedImage)} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors">
                                        Run Analysis
                                     </button>
                                )}
                            </div>
                        )}
                    </>
                  )}

                  {activeTab === 'pose' && (
                     <>
                        {poseError && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
                                <X className="w-5 h-5 flex-shrink-0" />
                                <p>{poseError}</p>
                            </div>
                        )}
                        {poseImage ? (
                            <PoseDisplay imageUrl={poseImage} />
                        ) : (
                             <div className="h-full rounded-xl border-2 border-dashed border-gray-800 bg-gray-900/30 flex flex-col items-center justify-center text-center p-8 text-gray-600">
                                <ImageIcon className="w-12 h-12 mb-4 text-gray-700" />
                                <p>Generate a simple line-drawing reference of the subject's pose.</p>
                                {uploadedImage ? (
                                    <button onClick={() => generatePose(uploadedImage)} disabled={poseState === AppState.ANALYZING} className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                        {poseState === AppState.ANALYZING ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : "Generate Pose"}
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-500 mt-2">Upload an image first</p>
                                )}
                            </div>
                        )}
                     </>
                  )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;