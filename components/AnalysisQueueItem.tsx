import React from 'react';
import { FileQueueItem } from '../pages/AnalyzerPage';
import { AnalysisResult } from './AnalysisResult';
import { Spinner } from './Spinner';
import { ExtractedData } from '../types';

interface AnalysisQueueItemProps {
    item: FileQueueItem;
    onSave: () => void;
    onRemove: () => void;
    onViewCustomer: () => void;
    onDataChange: (updatedData: ExtractedData) => void;
    isAnalyzing: boolean;
}

const FilePreview: React.FC<{ item: FileQueueItem }> = ({ item }) => {
    if (item.file.type.startsWith('image/')) {
        return <img src={item.previewUrl} alt={`Preview of ${item.file.name}`} className="w-16 h-16 object-cover rounded-md bg-slate-700" />;
    }
    if (item.file.type === 'application/pdf') {
        return (
            <div className="w-16 h-16 rounded-md bg-slate-700 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-red-300">PDF</span>
                <span className="text-[10px] text-slate-400 leading-tight">{(item.file.size / 1024).toFixed(1)} KB</span>
            </div>
        )
    }
    return (
        <div className="w-16 h-16 rounded-md bg-slate-700 flex items-center justify-center">
             <span className="text-xs text-slate-400">File</span>
        </div>
    )
};

const StatusIndicator: React.FC<{ status: FileQueueItem['status'] }> = ({ status }) => {
    switch(status) {
        case 'analyzing': return <div className="flex items-center gap-2"><Spinner /><span className="text-cyan-400">Analyzing...</span></div>;
        case 'success': return <span className="font-semibold text-green-400">Analysis Complete</span>;
        case 'error': return <span className="font-semibold text-red-400">Error</span>;
        case 'saving': return <div className="flex items-center gap-2"><Spinner /><span className="text-cyan-400">Saving...</span></div>;
        case 'saved': return <span className="font-semibold text-green-400">Saved to CRM</span>;
        case 'pending':
        default:
            return <span className="text-slate-400">Pending Analysis</span>;
    }
}

export const AnalysisQueueItem: React.FC<AnalysisQueueItemProps> = ({ item, onSave, onRemove, onViewCustomer, onDataChange, isAnalyzing }) => {
    return (
        <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
            <div className="flex items-center p-4 gap-4">
                <FilePreview item={item} />
                <div className="flex-grow">
                    <p className="font-semibold text-slate-100 truncate">{item.file.name}</p>
                    <div className="text-sm"><StatusIndicator status={item.status} /></div>
                </div>
                <button 
                    onClick={onRemove} 
                    disabled={isAnalyzing}
                    className="text-slate-500 hover:text-red-400 disabled:opacity-50"
                    aria-label="Remove item"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            {item.status === 'error' && item.error && (
                <div className="px-4 pb-4">
                    <p className="text-sm bg-red-900/50 p-2 rounded-md border border-red-700 text-red-300">{item.error}</p>
                </div>
            )}
            {item.status === 'success' && item.result && (
                <div className="p-4 border-t border-slate-700">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Document Preview */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">Document Preview</h3>
                            <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-600 sticky top-4">
                                {item.file.type.startsWith('image/') ? (
                                    <div className="relative">
                                        <img 
                                            src={item.previewUrl} 
                                            alt={`Preview of ${item.file.name}`} 
                                            className="w-full h-auto object-contain bg-slate-900"
                                            style={{ maxHeight: '70vh' }}
                                            onError={(e) => {
                                                console.error('Image failed to load:', item.previewUrl);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                ) : item.file.type === 'application/pdf' ? (
                                    <div className="p-8 text-center bg-slate-900">
                                        <svg className="w-24 h-24 mx-auto text-red-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-slate-300 font-bold text-lg mb-2">{item.file.name}</p>
                                        <p className="text-slate-400 text-sm">PDF Document</p>
                                        <p className="text-slate-500 text-xs mt-1">{(item.file.size / 1024).toFixed(1)} KB</p>
                                        <a 
                                            href={item.previewUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                                        >
                                            Open PDF
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-900">
                                        <p className="text-slate-400">Preview not available</p>
                                        <p className="text-slate-500 text-sm mt-2">{item.file.name}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Extracted Data */}
                        <div className="space-y-4">
                            <AnalysisResult data={item.result} onDataChange={onDataChange} />
                        </div>
                    </div>
                    
                    <button 
                        onClick={onSave}
                        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg"
                    >
                        Save to CRM
                    </button>
                </div>
            )}
             {item.status === 'saved' && item.result && (
                <div className="p-4 border-t border-slate-700">
                    <AnalysisResult data={item.result} />
                    <div className="mt-4 p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-center">
                        <p>Customer <span className="font-bold">{item.result.customer_name}</span> saved successfully.</p>
                        <button onClick={onViewCustomer} className="mt-1 text-cyan-400 font-bold hover:underline text-sm">View Customer Record</button>
                    </div>
                </div>
            )}
        </div>
    );
};