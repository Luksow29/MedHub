import React from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import PrintablePageWrapper from '../shared/PrintablePageWrapper';

// இந்த வகைகளை உங்கள் types கோப்பிலிருந்து இறக்குமதி செய்யவும்
import { Patient, Consultation, VitalSign, ClinicalNote, Diagnosis, Treatment, Prescription } from '../../types';

// இது API-இலிருந்து வரும் ஒருங்கிணைந்த தரவுக்கான ஒரு வகை
export interface DetailedConsultationSummary {
  consultation: Consultation;
  patient: Patient;
  vitalSigns: VitalSign | null;
  clinicalNote: ClinicalNote | null;
  diagnoses: Diagnosis[];
  treatments: Treatment[];
  prescriptions: Prescription[];
}

interface DetailedSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: DetailedConsultationSummary | null;
}

const DetailedSummaryModal: React.FC<DetailedSummaryModalProps> = ({ isOpen, onClose, summaryData }) => {
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handlePrint = () => {
    const printableContent = document.getElementById('detailed-summary-printable-content');
    if (printableContent) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Consultation Summary</title>
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

  if (!summaryData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading...">
        <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      </Modal>
    );
  }
  
  const { patient, consultation, vitalSigns, clinicalNote, diagnoses, treatments, prescriptions } = summaryData;
  const pageTitle = `Consultation Summary - ${patient.name} - ${consultation.consultationDate}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pageTitle} size="3xl">
        <div id="detailed-summary-printable-content" className="p-1">
            <PrintablePageWrapper pageTitle={pageTitle}>
                {/* Patient Demographics */}
                <div className="mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-slate-800">{patient.name}</h3>
                    <div className="text-sm text-slate-600 mt-1">
                        <span>{getBilingualLabel("DOB", "பிறந்த தேதி")}: {patient.dob}</span> | 
                        <span className="ml-2">{getBilingualLabel("Gender", "பாலினம்")}: {patient.gender}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                        <span>{getBilingualLabel("Contact", "தொடர்பு")}: {patient.phone}</span>
                    </div>
                </div>

                {/* Consultation Details */}
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-700 mb-2">{getBilingualLabel("Encounter Details", "சந்திப்பு விவரங்கள்")}</h4>
                    <p><span className="font-semibold">{getBilingualLabel("Date", "தேதி")}:</span> {consultation.consultationDate} {consultation.consultationTime}</p>
                    <p><span className="font-semibold">{getBilingualLabel("Attending Physician", "ஆலோசனை மருத்துவர்")}:</span> {consultation.attendingPhysician}</p>
                    <p><span className="font-semibold">{getBilingualLabel("Chief Complaint", "முதன்மை புகார்")}:</span> {consultation.chiefComplaint}</p>
                </div>

                {/* Vital Signs */}
                {vitalSigns && (
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">{getBilingualLabel("Vital Signs", "உயிர் அறிகுறிகள்")}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {vitalSigns.temperature && <p><span className="font-semibold">Temp:</span> {vitalSigns.temperature}°C</p>}
                            {vitalSigns.heartRate && <p><span className="font-semibold">HR:</span> {vitalSigns.heartRate} bpm</p>}
                            {vitalSigns.bloodPressureSystolic && <p><span className="font-semibold">BP:</span> {vitalSigns.bloodPressureSystolic}/{vitalSigns.bloodPressureDiastolic} mmHg</p>}
                            {vitalSigns.respiratoryRate && <p><span className="font-semibold">RR:</span> {vitalSigns.respiratoryRate}</p>}
                            {vitalSigns.oxygenSaturation && <p><span className="font-semibold">SpO2:</span> {vitalSigns.oxygenSaturation}%</p>}
                            {vitalSigns.bmi && <p><span className="font-semibold">BMI:</span> {vitalSigns.bmi}</p>}
                            {vitalSigns.painScore !== null && <p><span className="font-semibold">Pain:</span> {vitalSigns.painScore}/10</p>}
                        </div>
                    </div>
                )}
                
                {/* Clinical Notes (SOAP) */}
                {clinicalNote && (
                     <div className="mb-6">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">{getBilingualLabel("Clinical Notes", "மருத்துவக் குறிப்புகள்")}</h4>
                        {clinicalNote.subjective && <div><h5 className="font-semibold mt-2">Subjective:</h5><p className="text-sm whitespace-pre-wrap">{clinicalNote.subjective}</p></div>}
                        {clinicalNote.objective && <div><h5 className="font-semibold mt-2">Objective:</h5><p className="text-sm whitespace-pre-wrap">{clinicalNote.objective}</p></div>}
                        {clinicalNote.assessment && <div><h5 className="font-semibold mt-2">Assessment:</h5><p className="text-sm whitespace-pre-wrap">{clinicalNote.assessment}</p></div>}
                        {clinicalNote.plan && <div><h5 className="font-semibold mt-2">Plan:</h5><p className="text-sm whitespace-pre-wrap">{clinicalNote.plan}</p></div>}
                    </div>
                )}

                {/* Diagnoses */}
                {diagnoses && diagnoses.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">{getBilingualLabel("Diagnoses", "நோயறிதல்கள்")}</h4>
                        <ul className="list-disc list-inside text-sm">
                            {diagnoses.map(d => <li key={d.id}>{d.description} ({d.icdCode}) {d.isPrimary && <span className="font-bold text-sky-700">(Primary)</span>}</li>)}
                        </ul>
                    </div>
                )}
                
                {/* Treatments */}
                {treatments && treatments.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">{getBilingualLabel("Treatments", "சிகிச்சைகள்")}</h4>
                        <ul className="list-disc list-inside text-sm">
                            {treatments.map(t => <li key={t.id}>{t.treatmentName}</li>)}
                        </ul>
                    </div>
                )}
                
                {/* Prescriptions */}
                {prescriptions && prescriptions.length > 0 && (
                     <div className="mb-6">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">{getBilingualLabel("Prescriptions", "மருந்துகள்")}</h4>
                        <ul className="list-disc list-inside text-sm">
                            {prescriptions.map(p => <li key={p.id}>{p.medicationName} - {p.dosage} {p.frequency}</li>)}
                        </ul>
                    </div>
                )}
            </PrintablePageWrapper>
        </div>
        <div className="flex justify-end p-4 bg-slate-50 border-t no-print">
            <Button variant="secondary" onClick={onClose} className="mr-2">{getBilingualLabel("Close", "மூடு")}</Button>
            <Button variant="primary" onClick={handlePrint}>{getBilingualLabel("Print", "அச்சிடுக")}</Button>
        </div>
    </Modal>
  );
};

export default DetailedSummaryModal;