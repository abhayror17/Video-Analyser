import React, { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeVideoWithGemini } from './services/geminiService';
import { fileToBase64 } from './utils/file';
import { UploadIcon, VideoIcon, MagicWandIcon, LoadingIcon, XCircleIcon } from './components/icons';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import type { AnalysisResult } from './types';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const resetState = (clearPrompt = false) => {
    // The useEffect hook will handle revoking the old URL when videoPreviewUrl is set to null.
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setAnalysisResult(null);
    setError('');
    if(fileInputRef.current) fileInputRef.current.value = "";
    if (clearPrompt) setPrompt('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      resetState();
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } else {
      setError('Please select a valid video file.');
      resetState();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>) => event.preventDefault();
  
  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      resetState();
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
    } else {
      setError('Please drop a valid video file.');
      resetState();
    }
  };

  const handleAnalyzeAnother = () => resetState(true);
  const handleRemoveVideo = () => resetState(false);

  const handleLoadDemo = useCallback(async () => {
    setIsDemoLoading(true);
    setError('');
    resetState();

    try {
      const demoVideoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      const response = await fetch(demoVideoUrl);
      if (!response.ok) throw new Error(`Failed to fetch demo video: ${response.statusText}`);
      const blob = await response.blob();
      const file = new File([blob], "demo-video.mp4", { type: "video/mp4" });
      
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setPrompt("Provide a complete and structured analysis of this video.");
    } catch (err) {
      console.error("Demo load error:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading the demo.');
      resetState();
    } finally {
      setIsDemoLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!videoFile || !prompt) {
      setError('Please select a video and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const base64Data = await fileToBase64(videoFile);
      const videoDetails = { data: base64Data, mimeType: videoFile.type };
      const result = await analyzeVideoWithGemini(videoDetails, prompt);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [videoFile, prompt]);

  return (
    <div className="relative min-h-screen w-full bg-[#0c0a1a] text-gray-200 flex flex-col items-center p-4 md:p-6 overflow-hidden">
       {/* Aurora Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl animate-pulse animation-delay-4000"></div>
      </div>
      
      <div className="w-full max-w-7xl z-10">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-indigo-500">
            Gemini Video Analyzer
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            Unlock insights from your videos. Upload a file, ask a question, and let Gemini bring you the answers.
          </p>
        </header>

        {!videoPreviewUrl ? (
          <div 
            onDragOver={handleDragOver} 
            onDrop={handleDrop} 
            className="w-full max-w-2xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 p-6 sm:p-8 text-center"
          >
            <label htmlFor="video-upload" className="block cursor-pointer">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-5 bg-indigo-500/10 rounded-full border-2 border-dashed border-indigo-400/30">
                  <UploadIcon className="w-12 h-12 text-indigo-300" />
                </div>
                <p className="text-lg font-medium text-gray-300">
                  Drag & Drop a video or{' '}
                  <span className="text-indigo-400 font-semibold">click to upload</span>
                </p>
                <p className="text-sm text-gray-500">MP4, WebM, MOV, etc.</p>
              </div>
            </label>
            <div className="my-6 flex items-center justify-center">
              <span className="h-px w-full bg-white/10"></span>
              <span className="mx-4 text-sm text-gray-500 uppercase">OR</span>
              <span className="h-px w-full bg-white/10"></span>
            </div>
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); handleLoadDemo(); }}
              disabled={isDemoLoading || isLoading}
              className="w-full font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 rounded-lg px-5 py-3 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-wait"
            >
              {isDemoLoading ? 'Loading Demo...' : 'Try a Demo Video'}
            </button>
            <input
              ref={fileInputRef} id="video-upload" name="video-upload" type="file"
              accept="video/*" className="sr-only" onChange={handleFileChange} disabled={isDemoLoading}
            />
          </div>
        ) : (
          <main className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column: Video & Prompt */}
            <div className="flex flex-col space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 p-4 sm:p-6">
                <div className="relative group">
                  <video src={videoPreviewUrl} controls className="w-full aspect-video rounded-lg object-cover bg-black"/>
                  <button onClick={handleRemoveVideo} className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500/80 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Remove video">
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="mt-4 text-sm text-gray-400 truncate">
                  <VideoIcon className="w-4 h-4 inline-block mr-2 text-indigo-400" />
                  {videoFile?.name}
                </div>
              </div>
              <div className="flex-grow flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-4">2. Ask Gemini</h2>
                <textarea
                  value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Provide a complete and structured analysis of this video."
                  className="flex-grow w-full bg-black/20 border border-white/10 rounded-lg p-4 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 resize-none text-base"
                  rows={5}
                />
                 <button
                    onClick={handleSubmit} disabled={!videoFile || !prompt || isLoading || isDemoLoading}
                    className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0c0a1a] focus:ring-indigo-500 disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                >
                    {isLoading ? (
                      <><LoadingIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Analyzing...</>
                    ) : (
                      <><MagicWandIcon className="-ml-1 mr-2 h-5 w-5" />Analyze Video</>
                    )}
                </button>
              </div>
            </div>

            {/* Right Column: Analysis Result */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 p-4 sm:p-6 flex flex-col min-h-[400px]">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Analysis Result</h2>
              <div className="flex-grow overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <LoadingIcon className="h-10 w-10 text-indigo-400 animate-spin" />
                    <p className="mt-4 text-lg font-medium text-gray-300">Gemini is analyzing...</p>
                    <p className="text-sm text-gray-500">This may take a moment for longer videos.</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg h-full flex flex-col justify-center" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline mt-1">{error}</span>
                  </div>
                ) : analysisResult ? (
                  <AnalysisDisplay result={analysisResult} />
                ) : (
                   <div className="flex items-center justify-center h-full text-center text-gray-500">
                     <p>Your structured analysis will appear here.</p>
                   </div>
                )}
              </div>
               {analysisResult && !isLoading && (
                 <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <button
                      onClick={handleAnalyzeAnother}
                      className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0c0a1a] focus:ring-indigo-500 transition-all duration-300"
                    >
                      <UploadIcon className="-ml-1 mr-2 h-5 w-5" />
                      Analyze Another Video
                    </button>
                </div>
               )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default App;