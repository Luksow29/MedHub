// src/features/patient-management/components/InsuranceBillingForm.tsx

import React, { useState } from 'react';
import { InsuranceBilling, NewDbInsuranceBilling, UpdateDbInsuranceBilling } from '../../../types'; // பாதை சரிபார்க்கவும்
import Button from '../../../components/shared/Button'; // சரி செய்யப்பட்ட பாதை

interface InsuranceBillingFormProps {
  insuranceBilling?: InsuranceBilling;
  onSubmit: (data: NewDbInsuranceBilling | UpdateDbInsuranceBilling) => Promise<void>;
  onCancel: () => void;
}

const InsuranceBillingForm: React.FC<InsuranceBillingFormProps> = ({ insuranceBilling, onSubmit, onCancel }) => {
  const [insuranceProvider, setInsuranceProvider] = useState(insuranceBilling?.insuranceProvider || '');
  const [policyNumber, setPolicyNumber] = useState(insuranceBilling?.policyNumber || '');
  const [groupNumber, setGroupNumber] = useState(insuranceBilling?.groupNumber || '');
  const [isPrimary, setIsPrimary] = useState(insuranceBilling?.isPrimary ?? true);
  const [billingNotes, setBillingNotes] = useState(insuranceBilling?.billingNotes || '');
  const [isLoading, setIsLoading] = useState(false);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({
      insurance_provider: insuranceProvider,
      policy_number: policyNumber,
      group_number: groupNumber || null,
      is_primary: isPrimary,
      billing_notes: billingNotes || null,
    });
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="insuranceProvider" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Insurance Provider", "காப்பீட்டு வழங்குநர்")}</label>
        <input
          type="text"
          id="insuranceProvider"
          value={insuranceProvider}
          onChange={(e) => setInsuranceProvider(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="policyNumber" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Policy Number", "பாலிசி எண்")}</label>
        <input
          type="text"
          id="policyNumber"
          value={policyNumber}
          onChange={(e) => setPolicyNumber(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="groupNumber" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Group Number (Optional)", "குழு எண் (விருப்பமானது)")}</label>
        <input
          type="text"
          id="groupNumber"
          value={groupNumber || ''}
          onChange={(e) => setGroupNumber(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPrimary"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
        />
        <label htmlFor="isPrimary" className="ml-2 block text-sm text-slate-700">{getBilingualLabel("Is Primary Insurance?", "முதன்மை காப்பீடா?")}</label>
      </div>
      <div>
        <label htmlFor="billingNotes" className="block text-sm font-medium text-slate-700">{getBilingualLabel("Billing Notes", "பில்லிங் குறிப்புகள்")}</label>
        <textarea
          id="billingNotes"
          value={billingNotes || ''}
          onChange={(e) => setBillingNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {insuranceBilling ? getBilingualLabel("Update Insurance Info", "காப்பீட்டு தகவலைப் புதுப்பிக்கவும்") : getBilingualLabel("Add Insurance Info", "காப்பீட்டு தகவலைச் சேர்")}
        </Button>
      </div>
    </form>
  );
};

export default InsuranceBillingForm;