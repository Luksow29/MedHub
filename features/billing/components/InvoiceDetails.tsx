// File: features/billing/components/InvoiceDetails.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- சரிசெய்யப்பட்ட இறக்குமதிகள் ---
import { getInvoiceById, getInvoiceItems, cancelInvoice } from '../../../api/invoices';
import { getPaymentsForInvoice, recordPayment } from '../../../api/payments';
// பில்லிங் பகுதிக்குரிய வகைகளை இங்கிருந்து import செய்கிறோம்
import { DbInvoice, DbInvoiceItem, DbPayment } from '../types';

// ஒரு தற்காலிக Payment Form Modal கூறு
const PaymentModal = ({ isOpen, onClose, invoiceId, onPaymentSuccess }: any) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Cash');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        setIsSubmitting(true);
        try {
            await recordPayment({
                p_invoice_id: invoiceId,
                p_amount_paid: parseFloat(amount),
                p_payment_method: method,
                p_notes: notes,
            });
            alert('Payment recorded successfully!');
            onPaymentSuccess();
        } catch (error) {
            alert('Failed to record payment.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Record Payment</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required className="mt-1 p-2 block w-full border border-gray-300 rounded-md" />
                    </div>
                    <div className="mb-4">
                         <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <select value={method} onChange={e => setMethod(e.target.value)} className="mt-1 p-2 block w-full border border-gray-300 rounded-md">
                            <option>Cash</option>
                            <option>Credit Card</option>
                            <option>Bank Transfer</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Transaction notes..." className="mt-1 p-2 block w-full border border-gray-300 rounded-md" />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                            {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// முக்கிய InvoiceDetails கூறு
export const InvoiceDetails: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const navigate = useNavigate();
    const pdfRef = useRef<HTMLDivElement>(null);

    const [invoice, setInvoice] = useState<(DbInvoice & { patient_name: string; patient_phone: string; }) | null>(null);
    const [items, setItems] = useState<DbInvoiceItem[]>([]);
    const [payments, setPayments] = useState<DbPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!invoiceId) {
            setError("Invoice ID is missing.");
            setLoading(false);
            return;
        };
        
        try {
            setLoading(true);
            const [invoiceData, itemsData, paymentsData] = await Promise.all([
                getInvoiceById(invoiceId),
                getInvoiceItems(invoiceId),
                getPaymentsForInvoice(invoiceId),
            ]);
            setInvoice(invoiceData as any); // API function return type might need alignment
            setItems(itemsData);
            setPayments(paymentsData);
            setError(null);
        } catch (err) {
            setError('Failed to fetch invoice details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCancelInvoice = async () => {
        if (invoice && window.confirm('Are you sure you want to cancel this invoice?')) {
            await cancelInvoice(invoice.id);
            fetchData();
        }
    };

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        fetchData();
    };

    const handleDownloadPDF = () => {
        const input = pdfRef.current;
        if (input) {
            html2canvas(input).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
                pdf.save(`invoice-${invoice?.invoice_number}.pdf`);
            });
        }
    };
    
    // --- இதுதான் சரிசெய்யப்பட்ட ஃபங்ஷன் ---
    const handleSendWhatsApp = () => {
        if (!invoice || !invoice.patient_phone) {
            alert("Patient's phone number is not available.");
            return;
        }

        // 1. எண்ணில் உள்ள தேவையில்லாத குறியீடுகளை நீக்குதல் (எண்களை மட்டும் வைத்திருத்தல்)
        let cleanedPhone = invoice.patient_phone.replace(/\D/g, '');

        // 2. இந்திய எண்ணைக் கையாளுதல்
        // நிலைமை அ: எண் ஏற்கெனவே '91' உடன் தொடங்குகிறது (மொத்தம் 12 இலக்கங்கள்)
        if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
            // எண் சரியாக உள்ளது, எந்த மாற்றமும் தேவையில்லை.
        }
        // நிலைமை ஆ: எண் 10 இலக்கங்களில் உள்ளது (இந்திய மொபைல் எண்)
        else if (cleanedPhone.length === 10) {
            // முன்னால் '91' ஐச் சேர்க்கவும்
            cleanedPhone = '91' + cleanedPhone;
        }
        // நிலைமை இ: தவறான எண் வடிவம்
        else {
            alert(`Invalid phone number format: "${invoice.patient_phone}". Please ensure it's a 10-digit Indian mobile number or already includes the country code.`);
            return;
        }

        const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid.toString()), 0);
        const balanceDue = parseFloat(invoice.amount.toString()) - totalPaid;

        const message = `
Dear ${invoice.patient_name},

Here is your invoice summary from Med-Hub Clinic:

Invoice #: *${invoice.invoice_number}*
Total Amount: *₹${invoice.amount}*
Amount Paid: *₹${totalPaid.toFixed(2)}*
Balance Due: *₹${balanceDue.toFixed(2)}*

Thank you.
        `;
        
        const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message.trim())}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) return <div className="p-6 text-center">Loading invoice details...</div>;
    if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;
    if (!invoice) return <div className="p-6 text-center">Invoice not found.</div>;

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid.toString()), 0);
    const balanceDue = parseFloat(invoice.amount.toString()) - totalPaid;

    return (
        <>
            <div ref={pdfRef}>
                <div className="p-4 md:p-6 bg-white rounded-lg shadow-md">
                    <button onClick={() => navigate('/billing')} className="mb-4 text-blue-600 hover:underline">{'< Back to Invoices'}</button>
                    <header className="pb-4 border-b">
                        <h1 className="text-2xl font-bold text-gray-800">Invoice {invoice.invoice_number}</h1>
                        <p className="text-sm text-gray-500">Patient: {invoice.patient_name}</p>
                        <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${ invoice.status === 'paid' ? 'bg-green-100 text-green-800' : invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' }`}>
                            {invoice.status.toUpperCase()}
                        </span>
                    </header>

                    <div className="my-6 flex flex-wrap gap-4">
                        <button onClick={() => setIsPaymentModalOpen(true)} disabled={invoice.status === 'paid' || invoice.status === 'cancelled'} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-300">Record Payment</button>
                        <button onClick={handleSendWhatsApp} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600">Send via WhatsApp</button>
                        <button onClick={handleDownloadPDF} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600">Download PDF</button>
                        <button onClick={handleCancelInvoice} disabled={invoice.status === 'paid' || invoice.status === 'cancelled'} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 disabled:bg-gray-300">Cancel Invoice</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                        <div className="bg-gray-50 p-4 rounded-lg"><h4 className="text-sm text-gray-500">Total Amount</h4><p className="text-xl font-bold">₹{invoice.amount}</p></div>
                        <div className="bg-gray-50 p-4 rounded-lg"><h4 className="text-sm text-gray-500">Amount Paid</h4><p className="text-xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</p></div>
                        <div className="bg-gray-50 p-4 rounded-lg"><h4 className="text-sm text-gray-500">Balance Due</h4><p className="text-xl font-bold text-red-600">₹{balanceDue.toFixed(2)}</p></div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-2">Details</h3>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Description</th><th className="px-4 py-2 text-left">Quantity</th><th className="px-4 py-2 text-left">Unit Price</th><th className="px-4 py-2 text-left">Total</th></tr></thead>
                            <tbody>{items.map(item => (<tr key={item.id}><td className="px-4 py-2">{item.description}</td><td className="px-4 py-2">{item.quantity}</td><td className="px-4 py-2">₹{item.unit_price}</td><td className="px-4 py-2">₹{item.total_price}</td></tr>))}</tbody>
                        </table>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-2">Payments Received</h3>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Amount Paid</th><th className="px-4 py-2 text-left">Method</th><th className="px-4 py-2 text-left">Notes</th></tr></thead>
                            <tbody>{payments.map(payment => (<tr key={payment.id}><td className="px-4 py-2">{new Date(payment.payment_date).toLocaleString()}</td><td className="px-4 py-2">₹{payment.amount_paid}</td><td className="px-4 py-2">{payment.payment_method}</td><td className="px-4 py-2">{payment.notes}</td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            </div>
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} invoiceId={invoice.id} onPaymentSuccess={handlePaymentSuccess}/>
        </>
    );
};