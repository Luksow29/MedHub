// File: features/billing/hooks/usePayments.ts

import { useState, useEffect, useCallback } from "react";
// --- சரிசெய்யப்பட்ட பாதை ---
import { getAllPayments } from "../../../api/payments";
import { PaymentWithDetails } from "../types";

export const usePayments = () => {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllPayments();
      setPayments(data as PaymentWithDetails[]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, error, refetchPayments: fetchPayments };
};