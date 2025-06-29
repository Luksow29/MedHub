// File: features/billing/components/InvoicePDF.tsx

import React from 'react';
// This component is a template for printing or PDF conversion.

export const InvoicePDF = React.forwardRef(({ invoice, items, payments }: any, ref: any) => {
    if (!invoice) return null;

    const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid.toString()), 0);
    const balanceDue = parseFloat(invoice.amount.toString()) - totalPaid;

    return (
        <div ref={ref} style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <header>
                <h1>Invoice: {invoice.invoice_number}</h1>
                <p>Status: {invoice.status.toUpperCase()}</p>
            </header>
            <hr />
            <section>
                <div>
                    <strong>Billed to:</strong>
                    <p>{invoice.patient_name}</p>
                </div>
                <div>
                    <strong>From:</strong>
                    <p>{invoice.clinic_details?.name || 'Med-Hub Clinic'}</p>
                </div>
            </section>
            <section>
                <h3>Details</h3>
                <table> {/* Items Table */} </table>
            </section>
            <section>
                <h3>Summary</h3>
                <p>Total: ${invoice.amount}</p>
                <p>Paid: ${totalPaid.toFixed(2)}</p>
                <p><strong>Balance Due: ${balanceDue.toFixed(2)}</strong></p>
            </section>
        </div>
    );
});