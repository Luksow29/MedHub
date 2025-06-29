// File: features/billing/hooks/useInvoices.ts

import { useState, useEffect, useCallback } from 'react';
// --- சரிசெய்யப்பட்ட பாதை ---
import { getAllInvoices } from '../../../api/invoices';
import { InvoiceWithPatient } from '../types';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<InvoiceWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch invoices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, loading, error, refetchInvoices: fetchInvoices };
};