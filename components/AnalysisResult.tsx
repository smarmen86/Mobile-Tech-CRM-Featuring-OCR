import React from 'react';
import { ExtractedData } from '../types';

interface AnalysisResultProps {
  data: ExtractedData;
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


export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
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
        <dl>
            {formattedData.map((item, index) => (
                <ResultRow key={index} label={item.label} value={item.value} />
            ))}
        </dl>
    </div>
  );
};