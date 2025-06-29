import React from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { DetailedConsultationSummary } from './DetailedSummaryModal'; // আগের modal-லிருந்து type-ஐ மீண்டும் பயன்படுத்துகிறோம்

interface DetailedPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: DetailedConsultationSummary | null;
}

const DetailedPrescriptionModal: React.FC<DetailedPrescriptionModalProps> = ({ isOpen, onClose, summaryData }) => {
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handlePrint = () => {
    const printableContent = document.getElementById('prescription-printable-content');
    if (printableContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Prescription</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${printableContent.innerHTML}
          </body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.focus();
      setTimeout(() => {
        printWindow?.print();
        printWindow?.close();
      }, 250);
    }
  };

  if (!summaryData) return null;

  const { patient, consultation, vitalSigns, diagnoses, prescriptions } = summaryData;
  const primaryDiagnosis = diagnoses?.find(d => d.isPrimary) || diagnoses?.[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getBilingualLabel("Prescription", "மருந்துச்சீட்டு")} size="2xl">
      <div className="flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Scrollable Content Area */}
        <div id="prescription-printable-content" className="flex-grow overflow-y-auto p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Dr. {consultation.attendingPhysician}</h2>
            <p className="text-sm text-slate-500">M.B.B.S, M.D.</p>
            <p className="text-sm text-slate-500">Reg. No: 12345</p>
          </div>

          {/* Patient Details */}
          <div className="flex justify-between border-y py-2 mb-6 text-sm">
            <div>
              <span className="font-bold">{patient.name}</span> ({patient.gender})
            </div>
            <div>
              {getBilingualLabel("Age", "வயது")}: {new Date().getFullYear() - new Date(patient.dob).getFullYear()}
            </div>
            <div>
              {getBilingualLabel("Date", "தேதி")}: {new Date(consultation.consultationDate).toLocaleDateString()}
            </div>
          </div>
          
          {/* Vitals & Diagnosis */}
          <div className="grid grid-cols-2 gap-4 mb-6 border-b pb-4">
              <div>
                  <h4 className="font-semibold text-slate-700 mb-2">{getBilingualLabel("Vital Signs", "உயிர் அறிகுறிகள்")}</h4>
                  <div className="text-sm space-y-1">
                      {vitalSigns?.temperature !== null && <p>Temperature: {vitalSigns?.temperature}°C</p>}
                      {vitalSigns?.heartRate !== null && <p>Heart Rate: {vitalSigns?.heartRate} bpm</p>}
                      {vitalSigns?.bloodPressureSystolic !== null && <p>Blood Pressure: {vitalSigns?.bloodPressureSystolic}/{vitalSigns?.bloodPressureDiastolic} mmHg</p>}
                  </div>
              </div>
              <div>
                  <h4 className="font-semibold text-slate-700 mb-2">{getBilingualLabel("Diagnosis", "நோயறிதல்")}</h4>
                  <p className="text-sm">{primaryDiagnosis?.description || 'N/A'}</p>
              </div>
          </div>

          {/* Prescription Body */}
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">R<span className="text-xl">x</span></h2>
            <div className="space-y-4">
              {prescriptions.map((p, index) => (
                <div key={p.id} className="text-slate-800">
                  <p className="font-bold text-md">{index + 1}. {p.medicationName} <span className="text-sm font-normal text-slate-500">{p.dosage}</span></p>
                  <p className="pl-4 text-sm text-slate-600">{p.frequency} - {p.duration} days</p>
                  {p.specialInstructions && <p className="pl-4 text-xs text-slate-500">({p.specialInstructions})</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Signature Area */}
          <div className="pt-24 text-right">
              <div className="border-t-2 border-dotted border-slate-400 w-56 inline-block"></div>
              <p className="font-semibold text-slate-800">Dr. {consultation.attendingPhysician}</p>
              <p className="text-sm text-slate-500">{getBilingualLabel("Signature", "கையொப்பம்")}</p>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="flex-shrink-0 flex justify-end p-4 bg-slate-50 border-t no-print">
            <Button variant="secondary" onClick={onClose} className="mr-2">{getBilingualLabel("Close", "மூடு")}</Button>
            <Button variant="primary" onClick={handlePrint}>{getBilingualLabel("Print Prescription", "மருந்துச்சீட்டை அச்சிடுக")}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default DetailedPrescriptionModal;