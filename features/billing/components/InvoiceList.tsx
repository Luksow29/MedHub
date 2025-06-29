// File: features/billing/components/InvoiceList.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// --- சரிசெய்யப்பட்ட பாதைகள் (Corrected Paths) ---
import { getAllInvoices } from '../../../api/invoices';
import { DbInvoice } from '../types';

type InvoiceWithPatient = DbInvoice & { patient_name: string };

export const InvoiceList: React.FC = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<InvoiceWithPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setLoading(true);
                const data = await getAllInvoices();
                setInvoices(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch invoices.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const filteredInvoices = useMemo(() => {
        return invoices
            .filter(inv => filterStatus === 'All' || inv.status === filterStatus)
            .filter(inv =>
                inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [invoices, filterStatus, searchTerm]);

    const handleRowClick = (invoiceId: string) => {
        // ஒரு பக்கத்திலிருந்து மற்றொரு பக்கத்திற்குச் செல்லும் செயல்
        navigate(`/billing/invoices/${invoiceId}`);
    };

    if (loading) return <div className="p-4">Loading invoices...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Invoices</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by patient or invoice #"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md w-full md:w-1/3"
                />
                <div className="flex flex-wrap gap-2">
                    {['All', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                                filterStatus === status 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInvoices.map(invoice => (
                            <tr
                                key={invoice.id}
                                onClick={() => handleRowClick(invoice.id)}
                                className="hover:bg-gray-100 cursor-pointer"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.patient_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${invoice.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.due_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};