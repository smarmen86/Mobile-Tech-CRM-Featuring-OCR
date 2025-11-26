import React, { useState } from 'react';
import { ExtractedData } from '../types';

interface AnalysisResultProps {
  data: ExtractedData;
  onDataChange?: (updatedData: ExtractedData) => void;
}

const ResultRow: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => {
    if (!value) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between py-3 px-4 border-b border-slate-700 last:border-b-0">
            <dt className="font-medium text-slate-400">{label}</dt>
            <dd className="mt-1 sm:mt-0 text-slate-200 text-left sm:text-right font-mono">{value}</dd>
        </div>
    );
};

const EditableField: React.FC<{ 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'date';
}> = ({ label, value, onChange, type = 'text' }) => {
    return (
        <div className="py-3 px-4 border-b border-slate-700">
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            <input 
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-slate-200 font-mono focus:ring-cyan-500 focus:border-cyan-500"
            />
        </div>
    );
};

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, onDataChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData>(data);

  const handleEdit = () => {
    setEditedData(data);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onDataChange) {
      onDataChange(editedData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(data);
    setIsEditing(false);
  };

  const updateField = (field: keyof ExtractedData, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value || null }));
  };

  const formattedData: { label: string; value: string | null | undefined }[] = [
    { label: "Scan ID", value: data.scan_id },
    { label: "Generated Customer ID", value: data.customer_id },
    { label: "Generated Transaction ID", value: data.transaction_id },
    { label: "Customer Name", value: data.customer_name },
    { label: "Address", value: data.customer_address },
    { label: "Contact Phone", value: data.contact_phone_number },
    { label: "Serviced Phone", value: data.serviced_phone_number },
    { label: "Email", value: data.email },
    { label: "Transaction Date", value: data.transaction_date },
    { label: "IMEI", value: data.imei },
    { label: "SIM / ICCID", value: data.iccid },
    { label: "Network Provider", value: data.network_provider },
    { label: "Service Plan", value: data.service_plan },
    { label: "Plan Term", value: data.plan_term },
    { label: "Payment Breakdown", value: data.payment_breakdown },
    { label: "Total Payment", value: data.total_payment_amount },
    // Porting Details
    { label: "Port: Previous Carrier", value: data.port_current_carrier },
    { label: "Port: Account Number", value: data.port_account_number },
    { label: "Port: Transfer PIN", value: data.port_pin },
  ];

  return (
    <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
        {/* Header with Edit Button */}
        <div className="flex justify-between items-center px-4 py-3 bg-slate-800/80 border-b border-slate-700">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Extracted Data</h3>
            {!isEditing ? (
                <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                </button>
            ) : (
                <div className="flex gap-2">
                    <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save
                    </button>
                </div>
            )}
        </div>

        {/* Content */}
        <dl>
            {!isEditing ? (
                formattedData.map((item, index) => (
                    <ResultRow key={index} label={item.label} value={item.value} />
                ))
            ) : (
                <>
                    <EditableField label="Customer Name" value={editedData.customer_name || ''} onChange={(v) => updateField('customer_name', v)} />
                    <EditableField label="Address" value={editedData.customer_address || ''} onChange={(v) => updateField('customer_address', v)} />
                    <EditableField label="Contact Phone" value={editedData.contact_phone_number || ''} onChange={(v) => updateField('contact_phone_number', v)} type="tel" />
                    <EditableField label="Serviced Phone" value={editedData.serviced_phone_number || ''} onChange={(v) => updateField('serviced_phone_number', v)} type="tel" />
                    <EditableField label="Email" value={editedData.email || ''} onChange={(v) => updateField('email', v)} type="email" />
                    <EditableField label="Transaction Date" value={editedData.transaction_date || ''} onChange={(v) => updateField('transaction_date', v)} type="date" />
                    <EditableField label="IMEI" value={editedData.imei || ''} onChange={(v) => updateField('imei', v)} />
                    <EditableField label="SIM / ICCID" value={editedData.iccid || ''} onChange={(v) => updateField('iccid', v)} />
                    <EditableField label="Network Provider" value={editedData.network_provider || ''} onChange={(v) => updateField('network_provider', v)} />
                    <EditableField label="Service Plan" value={editedData.service_plan || ''} onChange={(v) => updateField('service_plan', v)} />
                    <EditableField label="Plan Term" value={editedData.plan_term || ''} onChange={(v) => updateField('plan_term', v)} />
                    <EditableField label="Payment Breakdown" value={editedData.payment_breakdown || ''} onChange={(v) => updateField('payment_breakdown', v)} />
                    <EditableField label="Total Payment" value={editedData.total_payment_amount || ''} onChange={(v) => updateField('total_payment_amount', v)} />
                    <EditableField label="Port: Previous Carrier" value={editedData.port_current_carrier || ''} onChange={(v) => updateField('port_current_carrier', v)} />
                    <EditableField label="Port: Account Number" value={editedData.port_account_number || ''} onChange={(v) => updateField('port_account_number', v)} />
                    <EditableField label="Port: Transfer PIN" value={editedData.port_pin || ''} onChange={(v) => updateField('port_pin', v)} />
                </>
            )}
        </dl>
    </div>
  );
};