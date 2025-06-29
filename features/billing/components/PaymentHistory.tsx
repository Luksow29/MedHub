// File: features/billing/components/PaymentHistory.tsx

import React from 'react';
import { usePayments } from '../hooks/usePayments';
import { PaymentWithDetails } from '../types';

export const PaymentHistory: React.FC = () => {
    const { payments, loading, error } = usePayments();

    // ஒரு குறிப்பிட்ட நேர மண்டலத்திற்கு தேதியை மாற்றுதல் (உதாரணத்திற்கு, Asia/Riyadh)
    const formatPaymentDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Riyadh' 
        });
    };

    if (loading) return <div className="p-4 text-center">Loading payment history...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">All Payments</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment: PaymentWithDetails) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {formatPaymentDate(payment.payment_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                                    {payment.invoices?.patients?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {payment.invoices?.invoice_number || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-bold">
                                    ${parseFloat(payment.amount_paid.toString()).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        payment.payment_method === 'Credit Card' ? 'bg-blue-100 text-blue-800' :
                                        payment.payment_method === 'Cash' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800' // Bank Transfer etc.
                                    }`}>
                                        {payment.payment_method}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};