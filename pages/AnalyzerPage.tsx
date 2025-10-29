import React, { useState, useCallback } from 'react';
import { ExtractedData } from '../types';
import { FileUploader } from '../components/FileUploader';
import { addCustomerFromExtraction } from '../services/db';
import { Page } from '../App';
import { AnalysisQueueItem } from '../components/AnalysisQueueItem';
import { analyzeDocument } from '../services/geminiService';


interface AnalyzerPageProps {
    navigateTo: (page: Page) => void;
}

export interface FileQueueItem {
    id: string;
    file: File;
    status: 'pending' | 'analyzing' | 'success' | 'error' | 'saving' | 'saved';
    previewUrl: string;
    result?: ExtractedData;
    error?: string;
}

export const AnalyzerPage: React.FC<AnalyzerPageProps> = ({ navigateTo }) => {
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = useCallback((files: File[]) => {
    const newItems: FileQueueItem[] = files.map(file => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      status: 'pending',
      previewUrl: URL.createObjectURL(file),
    }));
    setQueue(prev => [...prev, ...newItems]);
  }, []);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Create a new array from the current queue to process
    const itemsToProcess = queue.filter(item => item.status === 'pending' || item.status === 'error');

    for (const item of itemsToProcess) {
        // Set status to analyzing for the current item
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'analyzing' } : q));
        
        try {
            const result = await analyzeDocument(item.file);
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'success', result } : q));
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
            setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', error: errorMsg } : q));
        }
    }
    setIsAnalyzing(false);
  };
  
  const handleSaveToCrm = async (item: FileQueueItem) => {
    if (!item.result) return;
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'saving' } : q));
    try {
        await addCustomerFromExtraction(item.result);
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'saved' } : q));
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Failed to save to CRM.';
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', error: errorMsg } : q));
    }
  }

  const handleRemoveItem = (id: string) => {
    setQueue(prev => {
        const itemToRemove = prev.find(item => item.id === id);
        if (itemToRemove) {
            URL.revokeObjectURL(itemToRemove.previewUrl);
        }
        return prev.filter(item => item.id !== id);
    });
  };

  const handleClearQueue = () => {
    queue.forEach(item => URL.revokeObjectURL(item.previewUrl));
    setQueue([]);
  };

  const hasPendingFiles = queue.some(item => item.status === 'pending');

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-100">Document Analyzer</h1>
        <p className="text-lg text-slate-400 mt-2">Upload multiple documents to extract customer and transaction data in batches.</p>
      </header>

      <main className="space-y-8">
        <div className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 sm:p-8 backdrop-blur-sm border border-slate-700">
            <FileUploader onFileSelect={handleFileSelect} disabled={isAnalyzing} />
        </div>

        {queue.length > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 border border-slate-700">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-300">Analysis Queue ({queue.length})</h2>
                <div>
                   <button 
                      onClick={handleClearQueue} 
                      disabled={isAnalyzing}
                      className="text-sm text-slate-400 hover:text-red-400 transition mr-4 disabled:opacity-50"
                    >
                        Clear All
                    </button>
                    <button 
                        onClick={handleStartAnalysis}
                        disabled={!hasPendingFiles || isAnalyzing}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze All Pending'}
                    </button>
                </div>
             </div>
             <div className="space-y-4">
                {queue.map(item => (
                    <AnalysisQueueItem 
                        key={item.id}
                        item={item}
                        onSave={() => handleSaveToCrm(item)}
                        onRemove={() => handleRemoveItem(item.id)}
                        onViewCustomer={() => navigateTo('customers')}
                        isAnalyzing={isAnalyzing}
                    />
                ))}
             </div>
          </div>
        )}
      </main>
    </>
  );
};
