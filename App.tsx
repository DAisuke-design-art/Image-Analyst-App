import React, { useState, useRef } from 'react';
import { analyzeImageToJSON, generatePoseImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import JsonDisplay from './components/JsonDisplay';
import PoseDisplay from './components/PoseDisplay';
import { DualLanguagePromptData, AppState } from './types';
import { Loader2, X, Code2, ImageIcon, FileJson, Save, CheckCircle, Wand2, MessageSquare, UserCircle2 } from 'lucide-react';

// ★GASのURL（DAisukeさんの環境のもの）
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx5htiLmL8Fk8r45bVm9byWl-EmYo7mshJkj-wijdpo2E63RrVXn3dXu2DfEuGlrqOX/exec';

const App: React.FC = () => {
  const [jsonState, setJsonState] = useState<AppState>(AppState.IDLE);
  const [promptData, setPromptData] = useState<DualLanguagePromptData | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [poseState, setPoseState] = useState<AppState>(AppState.IDLE);
  const [detailedPose, setDetailedPose] = useState<string | null>(null);
  const [abstractPose, setAbstractPose] = useState<string | null>(null);
  const [poseError, setPoseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [faceRefImage, setFaceRefImage] = useState<string | null>(null);
  const [userInstructions, setUserInstructions] = useState<string>("");
  const miniFaceRef = useRef<HTMLDivElement>(null);

  const hasAnalysisStarted = jsonState !== AppState.IDLE || poseState !== AppState.IDLE || promptData !== null;

  const getAspectRatio = async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (Math.abs(ratio - 1) < 0.15) resolve("1:1");
        else if (ratio > 1.6) resolve("16:9");
        else if (ratio > 1.2) resolve("4:3");
        else if (ratio < 0.65) resolve("9:16");
        else if (ratio < 0.85) resolve("3:4");
        else resolve("1:1");
      };
      img.src = base64;
    });
  };

  const handleImageSelect = (base64: string) => setUploadedImage(base64);
  const handleFaceRefSelect = (base64: string) => setFaceRefImage(base64);

  const handleExecute = async () => {
    if (!uploadedImage) return;
    setPromptData(null);
    setDetailedPose(null);
    setAbstractPose(null);
    setJsonError(null);
    setPoseError(null);
    setSaveStatus('idle');
    const aspectRatio = await getAspectRatio(uploadedImage);
    runJsonAnalysis(uploadedImage, userInstructions);
    runPoseGeneration(uploadedImage, aspectRatio, userInstructions, faceRefImage);
  };

  const runJsonAnalysis = async (image: string, instructions: string) => {
    setJsonState(AppState.ANALYZING);
    try {
      const data = await analyzeImageToJSON(image, instructions);
      setPromptData(data);
      setJsonState(AppState.REVIEW);
    } catch (err: any) {
      console.error(err);
      setJsonError(err.message || "Failed to analyze image.");
      setJsonState(AppState.IDLE);
    }
  };

  const runPoseGeneration = async (image: string, aspectRatio: string, instructions: string, faceImage: string | null) => {
    setPoseState(AppState.ANALYZING);
    try {
      const detailedPromise = generatePoseImage(image, aspectRatio, 'detailed', instructions, faceImage);
      const abstractPromise = generatePoseImage(image, aspectRatio, 'abstract', instructions, faceImage);
      const [detailedResult, abstractResult] = await Promise.all([detailedPromise, abstractPromise]);
      setDetailedPose(detailedResult);
      setAbstractPose(abstractResult);
      setPoseState(AppState.REVIEW);
    } catch (err: any) {
      console.error(err);
      setPoseError(err.message || "Failed to generate pose.");
      setPoseState(AppState.IDLE);
    }
  };

  const saveToNotion = async () => {
    if (!promptData || isSaving) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      // Base64ヘッダー削除
      const cleanImageData = uploadedImage ? uploadedImage.replace(/^data:image\/\w+;base64,/, '') : '';
      const cleanFaceRefData = faceRefImage ? faceRefImage.replace(/^data:image\/\w+;base64,/, '') : null;
      // カテゴリ・キーワード整形
      const jpData = promptData.japanese;
      const keywordList = [
        jpData.VISUAL_STYLE.Vibe,
        jpData.VISUAL_STYLE.Artistic_Style,
        jpData.EMOTIONAL_PROFILE.Emotion,
        jpData.SCENE.Environment
      ].filter(Boolean);

      const payload = {
        authKey: 'MySecretPass123', // 認証キー
        subject: jpData.VISUAL_STYLE.Archetype || 'Image Analysis',
        category: jpData.VISUAL_STYLE.Archetype || 'Uncategorized',
        keywords: keywordList.join(','),
        details: jpData.fullPrompt,
        imageData: cleanImageData,
        faceRefData: cleanFaceRefData,
        english_analysis: promptData.english,
        userInstructions: userInstructions,
        ...jpData,
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
        throw new Error(result.message || 'Unknown error');
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

  const isAnalyzing = jsonState === AppState.ANALYZING || poseState === AppState.ANALYZING;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col h-screen overflow-hidden">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Image Analyst <span className="text-gray-500 text-sm font-normal ml-1">Local</span></h1>
          </div>
          <div className="flex items-center gap-4">
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
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></> :
                  saveStatus === 'success' ? <><CheckCircle className="w-4 h-4" /><span>Saved!</span></> :
                    <><Save className="w-4 h-4" /><span>Save to Notion</span></>}
              </button>
            )}
            <button onClick={() => reset(true)} className="text-sm text-gray-400 hover:text-white transition-colors">Reset All</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="flex flex-col gap-4 h-full min-h-0">
            <h2 className="text-lg font-semibold text-gray-300 flex items-center gap-2 shrink-0">1. Source & Instructions</h2>
            <div className={`flex flex-col ${hasAnalysisStarted ? 'flex-1 min-h-0' : 'h-1/2'}`}>
              {!uploadedImage ? <ImageUploader onImageSelected={handleImageSelect} className="h-full" label="Paste Pose Reference" /> :
                <div className="relative group rounded-xl overflow-hidden border border-gray-800 bg-gray-900 w-full flex-1 flex items-start justify-center p-4">
                  <img src={uploadedImage} alt="Pose" className="max-w-full max-h-full object-contain" />
                  <button onClick={() => setUploadedImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X className="w-4 h-4" /></button>
                </div>
              }
            </div>
            {!hasAnalysisStarted && (
              <div className="h-1/3 flex flex-col">
                <label className="text-xs text-pink-400 font-bold mb-2">Face Reference</label>
                {!faceRefImage ? <ImageUploader onImageSelected={handleFaceRefSelect} className="h-full" label="Paste Face Ref" /> :
                  <div className="relative group rounded-xl overflow-hidden border border-gray-800 bg-gray-900 w-full flex-1 flex items-center justify-center p-4">
                    <img src={faceRefImage} alt="Ref" className="max-w-full max-h-full object-contain" />
                    <button onClick={() => setFaceRefImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                }
              </div>
            )}
            <div className={`flex flex-col gap-2 ${hasAnalysisStarted ? 'h-auto' : 'flex-none'}`}>
              <div className="flex gap-2 h-24">
                <textarea value={userInstructions} onChange={(e) => setUserInstructions(e.target.value)} className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm text-white resize-none" placeholder="Instructions..." />
              </div>
              <button onClick={handleExecute} disabled={!uploadedImage || isAnalyzing} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex justify-center gap-2">
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Wand2 />} Generate
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 h-full min-h-0">
            <h2 className="text-lg font-semibold text-gray-300">2. Analysis</h2>
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {jsonError && (
                <div className="absolute inset-0 z-10 bg-gray-900/90 flex items-center justify-center p-4">
                  <div className="bg-red-500/10 border border-red-500 text-red-200 p-4 rounded-xl text-center">
                    <p className="font-bold mb-2">Analysis Failed</p>
                    <p className="text-sm">{jsonError}</p>
                    <button onClick={() => setJsonError(null)} className="mt-3 px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600">Dismiss</button>
                  </div>
                </div>
              )}
              {jsonState === AppState.ANALYZING ? (
                <div className="m-auto flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-gray-400 animate-pulse">Analyzing image structure...</p>
                </div>
              ) : promptData ? <JsonDisplay data={promptData} /> :
                <div className="m-auto text-gray-600 flex flex-col items-center"><FileJson className="w-12 h-12 mb-4" /><p>JSON here</p></div>}
            </div>
          </div>

          <div className="flex flex-col gap-4 h-full min-h-0">
            <h2 className="text-lg font-semibold text-gray-300">3. Pose Line Art</h2>
            <div className="flex-1 flex flex-col gap-4 min-h-0 relative">
              {poseError && (
                <div className="absolute inset-0 z-10 bg-gray-900/90 flex items-center justify-center p-4">
                  <div className="bg-red-500/10 border border-red-500 text-red-200 p-4 rounded-xl text-center">
                    <p className="font-bold mb-2">Pose Generation Failed</p>
                    <p className="text-sm">{poseError}</p>
                    <button onClick={() => setPoseError(null)} className="mt-3 px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600">Dismiss</button>
                  </div>
                </div>
              )}
              {poseState === AppState.ANALYZING ? (
                <div className="m-auto flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-gray-400 animate-pulse">Generating poses...</p>
                </div>
              ) : (detailedPose || abstractPose) ? <>
                <div className="h-1/2 min-h-0 flex flex-col">{detailedPose && <PoseDisplay imageUrl={detailedPose} title="Detailed" className="h-full" />}</div>
                <div className="h-1/2 min-h-0 flex flex-col">{abstractPose && <PoseDisplay imageUrl={abstractPose} title="Abstract" className="h-full" />}</div>
              </> :
                <div className="m-auto text-gray-600 flex flex-col items-center"><ImageIcon className="w-12 h-12 mb-4" /><p>Image here</p></div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;