// File: pages/BillingPage.tsx

import React, { useState } from 'react';
import { BillingDashboard } from '../features/billing/components/BillingDashboard';
import { InvoiceList } from '../features/billing/components/InvoiceList';
import { PaymentHistory } from '../features/billing/components/PaymentHistory';

export const BillingPage: React.FC = () => {
    type View = 'dashboard' | 'invoices' | 'payments';
    const [view, setView] = useState<View>('dashboard');

    const NavButton = ({ title, currentView, targetView }: { title: string; currentView: View; targetView: View; }) => (
        <button
            onClick={() => setView(targetView)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${currentView === targetView
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
        >
            {title}
        </button>
    );

    const renderView = () => {
        switch (view) {
            case 'dashboard': return <BillingDashboard />;
            case 'invoices': return <InvoiceList />;
            case 'payments': return <PaymentHistory />;
            default: return <BillingDashboard />;
        }
    };
    
    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Billing Management</h1>
                <nav className="mb-6 bg-white p-2 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2">
                        <NavButton title="Dashboard" currentView={view} targetView="dashboard" />
                        <NavButton title="Invoices" currentView={view} targetView="invoices" />
                        <NavButton title="Payment History" currentView={view} targetView="payments" />
                    </div>
                </nav>
                <main>
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default BillingPage;