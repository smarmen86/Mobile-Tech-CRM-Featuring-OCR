
// Data structure for the initial output from the Gemini analysis
export interface ExtractedData {
  scan_id: string;
  customer_id: string;
  transaction_id: string;
  customer_name: string | null;
  customer_address: string | null;
  contact_phone_number: string | null;
  serviced_phone_number: string | null;
  email: string | null;
  imei: string | null;
  iccid: string | null;
  service_plan: string | null;
  plan_term: string | null;
  network_provider: string | null;
  transaction_date: string | null;
  payment_breakdown: string | null;
  total_payment_amount: string | null;
  // Manual Entry / Porting Fields
  port_current_carrier?: string | null;
  port_account_number?: string | null;
  port_pin?: string | null;
}

// Data structure for a Device record in the CRM
export interface Device {
  imei: string | null;
  iccid: string | null;
  serviced_phone_number: string | null;
  network_provider: string | null;
}

// Data structure for a Transaction record in the CRM
export interface Transaction {
  id: string;
  customerId: string;
  date: string;
  description: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  scanId?: string;
  device?: Device;
  plan?: {
    name: string | null;
    term: string | null;
  }
}

// Data structure for a Customer record in the CRM
export interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  address: string | null;
  contact_phone_number: string | null;
  createdAt: string;
}
