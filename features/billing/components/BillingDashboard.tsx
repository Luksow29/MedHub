// File: features/billing/components/BillingDashboard.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase'; // Supabase client-ஐ import செய்யவும்

// StatCard கூறு எந்த மாற்றமும் இல்லாமல் அப்படியே இருக்கும்
const StatCard = ({ title, value, colorClass = 'text-gray-800' }: { title: string; value: string | number; colorClass?: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-md transition hover:shadow-lg">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</p>
    </div>
);

export const BillingDashboard: React.FC = () => {
    // புள்ளிவிவரங்களைச் சேமிக்க ஒரு state
    const [stats, setStats] = useState({
        totalRevenue: 0,
        outstandingAmount: 0,
        overdueCount: 0,
        totalInvoices: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // கூறு (component) தோன்றும்போது, பின்தள ஃபங்ஷனை அழைக்கும் useEffect
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            // நமது புதிய பின்தள ஃபங்ஷனை RPC மூலம் அழைக்கிறோம்
            const { data, error: rpcError } = await supabase.rpc('get_billing_stats');

            if (rpcError) {
                console.error('Error fetching billing stats:', rpcError);
                setError('Could not load dashboard data.');
            } else if (data) {
                // பின்தளத்தில் இருந்து வரும் தரவை state-இல் சேமிக்கிறோம்
                setStats(data);
            }
            setLoading(false);
        };

        fetchStats();
    }, []); // இந்த effect ஒருமுறை மட்டுமே இயங்கும்

    if (loading) return <div className="p-4">Loading dashboard stats...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Billing Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue (Paid)" value={`$${stats.totalRevenue.toFixed(2)}`} colorClass="text-green-600" />
                <StatCard title="Total Outstanding" value={`$${stats.outstandingAmount.toFixed(2)}`} colorClass="text-yellow-600" />
                <StatCard title="Invoices Overdue" value={stats.overdueCount} colorClass="text-red-600" />
                <StatCard title="Total Invoices" value={stats.totalInvoices} />
            </div>
        </div>
    );
};