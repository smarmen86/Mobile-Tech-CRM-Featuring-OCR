
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ExtractedData } from '../types';
import { FileUploader } from '../components/FileUploader';
import { addCustomerFromExtraction, API_BASE_URL } from '../services/db';
import { Page } from '../App';
import { AnalysisQueueItem } from '../components/AnalysisQueueItem';
import { analyzeDocument } from '../services/geminiService';
import { ServerStatusBanner } from '../components/ServerStatusBanner';

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
  const [activeTab, setActiveTab] = useState<'automation' | 'upload' | 'manual'>('automation');
  
  // Drive State
  const [driveFolderId, setDriveFolderId] = useState('');
  const [isWatcherActive, setIsWatcherActive] = useState(false);
  const [driveLogs, setDriveLogs] = useState<{id: string, timestamp: string, message: string, type: string}[]>([]);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('online');

  // Upload State
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Use ref to track queue for cleanup on unmount
  const queueRef = useRef<FileQueueItem[]>([]);
  useEffect(() => {
      queueRef.current = queue;
  }, [queue]);

  // Cleanup URLs on unmount
  useEffect(() => {
      return () => {
          queueRef.current.forEach(item => URL.revokeObjectURL(item.previewUrl));
      };
  }, []);

  // Manual Entry State
  const [manualForm, setManualForm] = useState({
      firstName: '', lastName: '', phone: '', email: '',
      imei: '', iccid: '', carrier: '', planName: '', planPrice: '',
      isPort: false, portCarrier: '', portAccount: '', portPin: ''
  });
  const [manualSaveStatus, setManualSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Check backend connection and Drive status
  useEffect(() => {
    const checkStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/drive/status`);
            if (res.ok) {
                const data = await res.json();
                setIsWatcherActive(data.active);
                if (data.folderId) setDriveFolderId(data.folderId);
                setDriveLogs(data.logs || []);
                setBackendStatus('online');
            } else {
                setBackendStatus('offline');
            }
        } catch (e) {
            setBackendStatus('offline');
        }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000); // Poll logs every 3s
    return () => clearInterval(interval);
  }, []);

  const toggleWatcher = async () => {
      try {
          const res = await fetch(`${API_BASE_URL}/drive/configure`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ folderId: driveFolderId, active: !isWatcherActive })
          });
          const data = await res.json();
          setIsWatcherActive(data.active);
      } catch (e) {
          console.error("Failed to toggle watcher", e);
      }
  };

  // Manual Upload Logic
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
    const itemsToProcess = queue.filter(item => item.status === 'pending' || item.status === 'error');

    for (const item of itemsToProcess) {
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

  // Manual Entry Logic
  const handleManualSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setManualSaveStatus('saving');
      
      const extracted: ExtractedData = {
          scan_id: 'manual_entry',
          customer_id: crypto.randomUUID(),
          transaction_id: crypto.randomUUID(),
          customer_name: `${manualForm.firstName} ${manualForm.lastName}`.trim(),
          customer_address: null,
          contact_phone_number: manualForm.phone,
          serviced_phone_number: manualForm.phone,
          email: manualForm.email || null,
          imei: manualForm.imei || null,
          iccid: manualForm.iccid || null,
          service_plan: manualForm.planName || null,
          plan_term: 'Monthly',
          network_provider: manualForm.carrier || null,
          transaction_date: new Date().toISOString(),
          payment_breakdown: 'Manual Activation',
          total_payment_amount: manualForm.planPrice,
          
          port_current_carrier: manualForm.isPort ? manualForm.portCarrier : null,
          port_account_number: manualForm.isPort ? manualForm.portAccount : null,
          port_pin: manualForm.isPort ? manualForm.portPin : null,
      };

      try {
          await addCustomerFromExtraction(extracted);
          setManualSaveStatus('success');
          setTimeout(() => setManualSaveStatus('idle'), 3000);
          // Clean reset
          setManualForm({
            firstName: '', lastName: '', phone: '', email: '',
            imei: '', iccid: '', carrier: '', planName: '', planPrice: '',
            isPort: false, portCarrier: '', portAccount: '', portPin: ''
          });
      } catch (error) {
          setManualSaveStatus('error');
      }
  };

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold text-slate-100">Automation Center</h1>
                <p className="text-lg text-slate-400 mt-2">Manage Drive sync, uploads, and activations.</p>
            </div>
            {backendStatus === 'online' && isWatcherActive && (
                <div className="bg-green-900/30 border border-green-500/30 rounded-full px-4 py-1.5 flex items-center gap-2">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                     </span>
                     <span className="text-sm font-mono text-green-400 font-medium">SYSTEM ONLINE</span>
                </div>
            )}
        </div>
      </header>

      {backendStatus === 'offline' && <div className="mb-6"><ServerStatusBanner /></div>}

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-slate-800/50 p-1 rounded-xl border border-slate-700 inline-flex">
          <button 
            onClick={() => setActiveTab('automation')}
            className={`py-2 px-6 rounded-lg text-sm font-bold transition-all ${activeTab === 'automation' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            Drive Automation
          </button>
           <button 
             onClick={() => setActiveTab('manual')}
             className={`py-2 px-6 rounded-lg text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            Manual Entry
          </button>
          <button 
             onClick={() => setActiveTab('upload')}
             className={`py-2 px-6 rounded-lg text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            File Upload
          </button>
      </div>

      <main>
        {activeTab === 'automation' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Config Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 1.485c-5.54 0-9.985 4.445-9.985 9.985 0 5.54 4.445 9.985 9.985 9.985 5.54 0 9.985-4.445 9.985-9.985 0-5.54-4.445-9.985-9.985-9.985zm-1.45 16.28l-4.98-8.625h3.39l3.285 5.685 3.425-5.685h3.27l-5.16 8.625h-3.23zM19.35 7.5h-1.9l-1.95 3.335L12.995 7.5h-6.61l3.385-5.75h7.195l2.385 5.75z"/></svg>
                            Drive Configuration
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Folder ID</label>
                                <input 
                                    type="text" 
                                    value={driveFolderId}
                                    onChange={(e) => setDriveFolderId(e.target.value)}
                                    placeholder="e.g., 1A2b3C4d5E6f..."
                                    disabled={isWatcherActive}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Ensure the folder is shared with the Service Account email from your backend configuration.
                                </p>
                            </div>
                            
                            <button
                                onClick={toggleWatcher}
                                disabled={!driveFolderId || backendStatus === 'offline'}
                                className={`w-full py-2 px-4 rounded-lg font-bold transition-all ${
                                    isWatcherActive 
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20' 
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isWatcherActive ? 'Stop Watching' : 'Start Automation'}
                            </button>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                                <div className={`w-3 h-3 rounded-full ${isWatcherActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                <span className="text-sm text-slate-300">Status: {isWatcherActive ? 'Monitoring Drive...' : 'Inactive'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logs Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                            <h3 className="font-mono text-sm font-bold text-slate-300 uppercase tracking-wider">Live Logs</h3>
                            <span className="text-xs text-slate-500">Auto-refreshing</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                            {driveLogs.length === 0 ? (
                                <p className="text-slate-600 text-center mt-20 italic">No logs yet. Start the automation to see activity.</p>
                            ) : (
                                driveLogs.map(log => (
                                    <div key={log.id} className="flex gap-3 animate-fadeIn">
                                        <span className="text-slate-500 shrink-0">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className={`${
                                            log.type === 'error' ? 'text-red-400' : 
                                            log.type === 'success' ? 'text-green-400' : 
                                            'text-cyan-200'
                                        }`}>
                                            {log.type === 'info' && '> '}
                                            {log.message}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'manual' && (
            <div className="max-w-4xl mx-auto">
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 shadow-xl">
                    <div className="mb-6 pb-6 border-b border-slate-700">
                         <h2 className="text-2xl font-bold text-white">Manual Activation / Port Entry</h2>
                         <p className="text-slate-400 mt-1">Manually record a new activation or port-in without a document scan.</p>
                    </div>

                    <form onSubmit={handleManualSubmit} className="space-y-8">
                        {/* Customer Details */}
                        <div>
                            <h3 className="text-lg font-medium text-cyan-400 mb-4">Customer Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                                    <input type="text" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                        value={manualForm.firstName} onChange={e => setManualForm({...manualForm, firstName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                                    <input type="text" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                        value={manualForm.lastName} onChange={e => setManualForm({...manualForm, lastName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                                    <input type="tel" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                        value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Email (Optional)</label>
                                    <input type="email" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                        value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Device & Plan */}
                        <div>
                            <h3 className="text-lg font-medium text-cyan-400 mb-4">Device & Plan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">IMEI</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500 font-mono" 
                                        value={manualForm.imei} onChange={e => setManualForm({...manualForm, imei: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">ICCID (SIM)</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500 font-mono" 
                                        value={manualForm.iccid} onChange={e => setManualForm({...manualForm, iccid: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Carrier / Network</label>
                                    <select className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500"
                                        value={manualForm.carrier} onChange={e => setManualForm({...manualForm, carrier: e.target.value})}>
                                        <option value="">Select Carrier</option>
                                        <option value="T-Mobile">T-Mobile</option>
                                        <option value="AT&T">AT&T</option>
                                        <option value="Verizon">Verizon</option>
                                        <option value="Metro">Metro</option>
                                        <option value="Boost">Boost</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Plan Name</label>
                                        <input type="text" placeholder="e.g. Unlimited" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                            value={manualForm.planName} onChange={e => setManualForm({...manualForm, planName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Price ($)</label>
                                        <input type="number" placeholder="0.00" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                            value={manualForm.planPrice} onChange={e => setManualForm({...manualForm, planPrice: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Port-In Details */}
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                            <div className="flex items-center mb-4">
                                <input id="isPort" type="checkbox" className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-600 focus:ring-2"
                                    checked={manualForm.isPort} onChange={e => setManualForm({...manualForm, isPort: e.target.checked})} />
                                <label htmlFor="isPort" className="ml-2 text-sm font-medium text-slate-200">This is a Port-In</label>
                            </div>

                            {manualForm.isPort && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Previous Carrier</label>
                                        <input type="text" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                            value={manualForm.portCarrier} onChange={e => setManualForm({...manualForm, portCarrier: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Account Number</label>
                                        <input type="text" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                            value={manualForm.portAccount} onChange={e => setManualForm({...manualForm, portAccount: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Transfer PIN</label>
                                        <input type="text" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500" 
                                            value={manualForm.portPin} onChange={e => setManualForm({...manualForm, portPin: e.target.value})} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                             <button type="submit" disabled={manualSaveStatus === 'saving'} className={`
                                px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95
                                ${manualSaveStatus === 'saving' ? 'bg-slate-600 cursor-not-allowed' : 
                                  manualSaveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                                  'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'}
                             `}>
                                {manualSaveStatus === 'saving' ? 'Saving...' : 
                                 manualSaveStatus === 'success' ? 'Saved Successfully!' : 
                                 'Submit Activation'}
                             </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {activeTab === 'upload' && (
            <>
                <div className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 sm:p-8 backdrop-blur-sm border border-slate-700">
                    <FileUploader onFileSelect={handleFileSelect} disabled={isAnalyzing} />
                </div>

                {queue.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 border border-slate-700 mt-8">
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
            </>
        )}
      </main>
    </>
  );
};