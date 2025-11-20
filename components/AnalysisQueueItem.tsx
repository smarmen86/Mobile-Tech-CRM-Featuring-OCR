import React from 'react';
import { FileQueueItem } from '../pages/AnalyzerPage';
import { AnalysisResult } from './AnalysisResult';
import { Spinner } from './Spinner';

interface AnalysisQueueItemProps {
    item: FileQueueItem;
    onSave: () => void;
    onRemove: () => void;
    onViewCustomer: () => void;
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

export const AnalysisQueueItem: React.FC<AnalysisQueueItemProps> = ({ item, onSave, onRemove, onViewCustomer, isAnalyzing }) => {
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
                    <h3 className="text-lg font-bold mb-2 text-cyan-400">Extracted Information</h3>
                    <AnalysisResult data={item.result} />
                    <button 
                        onClick={onSave}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
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