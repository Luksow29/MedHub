// File: features/billing/types.ts

// இந்த கோப்பு பில்லிங் பகுதிக்குத் தேவையான அனைத்து வகைகளையும் வரையறுக்கிறது.

// உங்கள் தரவுத்தளத்தின் புலங்களுடன் பொருந்தக்கூடிய அடிப்படை வகைகள்
// Base types that match your database columns.

export interface DbBase {
    id: string;
    created_at: string;
}

export interface DbInvoice extends DbBase {
    patient_id: string;
    consultation_id: string | null;
    user_id: string;
    invoice_number: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    amount: number;
    due_date: string;
    clinic_details: any;
    patient_details: any;
    sent_at: string | null;
    paid_at: string | null;
}

export interface DbInvoiceItem extends DbBase {
    invoice_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface DbPayment extends DbBase {
    invoice_id: string;
    user_id: string;
    amount_paid: number;
    payment_date: string;
    payment_method: string;
    status: 'pending' | 'succeeded' | 'failed';
    transaction_id: string | null;
    receipt_url: string | null;
    notes: string | null;
}


// --- UI கூறுகளில் பயன்படுத்தப்படும் விரிவாக்கப்பட்ட வகைகள் ---
// --- Extended types used in UI components ---

/**
 * இன்வாய்ஸ் தரவுகளுடன் நோயாளியின் பெயரை இணைக்கும் வகை.
 * Type that joins the patient's name with the invoice data.
 */
export type InvoiceWithPatient = DbInvoice & {
  patient_name: string;
  patient_phone: string; // WhatsApp அம்சத்திற்காக
};

/**
 * கட்டணத் தரவுகளுடன் இன்வாய்ஸ் மற்றும் நோயாளி விவரங்களை இணைக்கும் வகை.
 * Type that joins invoice and patient details with the payment data.
 */
export type PaymentWithDetails = DbPayment & {
  invoices: {
    invoice_number: string;
    patients: {
      name: string;
    } | null;
  } | null;
};