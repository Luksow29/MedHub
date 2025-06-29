// File: features/whatsapp/components/MessageSender.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { getAllPatientsForSelect, getPatientFullDetails } from '../../../api/whatsapp';
import { getTemplates } from '../../../api/whatsapp';

// Define types for the data
interface Patient { id: string; name: string; }
interface Template { id: string; name: string; template_text: string; }
interface PatientData {
    patient: any;
    appointments: any[] | null;
    consultations: any[] | null;
    invoices: any[] | null;
    payments: any[] | null; // கட்டணங்களுக்கான வகையைச் சேர்க்கவும்
}

// --- புதிய துணை-கூறு: நோயாளி விவரங்களைக் காட்ட ---
const PatientInfoPanel = ({ patientData, loading }: { patientData: PatientData | null; loading: boolean; }) => {
    if (loading) {
        return <div className="p-4 border rounded-lg bg-gray-50 text-center">Loading Patient Data...</div>;
    }
    if (!patientData || !patientData.patient) {
        return <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-500">Select a patient to see their details.</div>;
    }
    
    return (
        <div className="border rounded-lg p-4 h-full bg-white">
            <h4 className="font-bold text-lg mb-4">Patient Information</h4>
            <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {patientData.patient.name}</p>
                <p><strong>Phone:</strong> {patientData.patient.contact_phone}</p>
                <p><strong>Email:</strong> {patientData.patient.contact_email}</p>
                <hr className="my-3"/>
                <p><strong>Total Appointments:</strong> {patientData.appointments?.length || 0}</p>
                <p><strong>Total Consultations:</strong> {patientData.consultations?.length || 0}</p>
                <p><strong>Total Invoices:</strong> {patientData.invoices?.length || 0}</p>
            </div>
        </div>
    );
};

export const MessageSender: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    
    const [dataSource, setDataSource] = useState<'appointments' | 'consultations' | 'invoices'>('appointments');
    const [selectedRecordId, setSelectedRecordId] = useState<string>('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    // Fetch patients and templates on initial load
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [patientsData, templatesData] = await Promise.all([
                    getAllPatientsForSelect(),
                    getTemplates()
                ]);
                setPatients(patientsData);
                setTemplates(templatesData);
            } catch (error) {
                console.error("Error loading initial data", error);
            }
        };
        loadInitialData();
    }, []);

    // Fetch full patient details when a patient is selected
    useEffect(() => {
        if (!selectedPatientId) {
            setPatientData(null);
            setSelectedRecordId('');
            setSelectedTemplateId('');
            return;
        }
        const fetchPatientData = async () => {
            setLoadingData(true);
            try {
                const data = await getPatientFullDetails(selectedPatientId);
                setPatientData(data);
            } catch (error) {
                console.error("Error fetching patient details", error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchPatientData();
    }, [selectedPatientId]);

    // --- மெசேஜ் உருவாக்கும் தர்க்கம் - முழுமையாக சரிசெய்யப்பட்டது ---
    const generatedMessage = useMemo(() => {
        if (!selectedTemplateId || !patientData || !selectedRecordId) {
            return '';
        }
        
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) return '';

        const record = patientData[dataSource]?.find(r => r.id === selectedRecordId);
        if (!record) return `Selected ${dataSource.slice(0, -1)} could not be found. Please re-select.`;
        
        // --- உண்மையான பேலன்ஸ் தொகையைக் கணக்கிடும் புதிய தர்க்கம் ---
        let balanceDue = record.amount;
        let lastPaymentAmount = null;

        if (dataSource === 'invoices' && record && patientData.payments) {
            const relevantPayments = patientData.payments.filter(p => p.invoice_id === record.id);
            const totalPaid = relevantPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid.toString()), 0);
            balanceDue = parseFloat(record.amount.toString()) - totalPaid;

            if (relevantPayments.length > 0) {
                lastPaymentAmount = relevantPayments[0].amount_paid;
            }
        }
        // --- கணக்கீட்டு தர்க்கம் முடிவு ---

        const dataContext: { [key: string]: any } = {
            patient_name: patientData.patient?.name,
            patient_phone: patientData.patient?.contact_phone,
            patient_email: patientData.patient?.contact_email,
            
            appointment_date: record.date,
            appointment_time: record.time,
            
            consultation_date: record.consultation_date,
            
            invoice_number: record.invoice_number,
            invoice_amount: record.amount,
            invoice_due_date: record.due_date,
            
            payment_amount: lastPaymentAmount ? lastPaymentAmount.toFixed(2) : 'N/A',
            invoice_balance: balanceDue ? balanceDue.toFixed(2) : 'N/A',
        };

        let message = template.template_text.replace(/{{(.*?)}}/g, (match, placeholder) => {
            const key = placeholder.trim();
            if (dataContext[key] !== null && dataContext[key] !== undefined) {
                return dataContext[key];
            }
            return match;
        });

        return message;

    }, [selectedTemplateId, selectedRecordId, patientData, templates, dataSource]);
    
    const handleSend = () => {
        if (!patientData?.patient?.contact_phone || !generatedMessage) {
            alert('Patient phone number or message is missing.');
            return;
        }
        let cleanedPhone = patientData.patient.contact_phone.replace(/\D/g, '');
        if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
            // Correct
        } else if (cleanedPhone.length === 10) {
            cleanedPhone = '91' + cleanedPhone;
        } else {
            alert(`Invalid phone number format: "${patientData.patient.contact_phone}".`);
            return;
        }
        const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(generatedMessage.trim())}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                <div className="space-y-4 md:col-span-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">1. Select Patient</label>
                        <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} className="mt-1 p-2 w-full border rounded-md">
                            <option value="">-- Choose a patient --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {selectedPatientId && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">2. Select Data Source</label>
                                <select value={dataSource} onChange={e => { setDataSource(e.target.value as any); setSelectedRecordId(''); }} className="mt-1 p-2 w-full border rounded-md">
                                    <option value="appointments">Appointments</option>
                                    <option value="consultations">Consultations</option>
                                    <option value="invoices">Invoices</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">3. Select Specific Record</label>
                                <select value={selectedRecordId} onChange={e => setSelectedRecordId(e.target.value)} className="mt-1 p-2 w-full border rounded-md" disabled={!patientData || !patientData[dataSource] || patientData[dataSource]?.length === 0}>
                                    <option value="">-- Choose a record --</option>
                                    {patientData?.[dataSource]?.map((record: any) => (
                                        <option key={record.id} value={record.id}>
                                            {record.reason || record.chief_complaint || record.invoice_number || record.date || `Record ID: ${record.id.substring(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">4. Select Template</label>
                                <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="mt-1 p-2 w-full border rounded-md" disabled={!selectedRecordId}>
                                    <option value="">-- Choose a template --</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                <div className="md:col-span-1">
                    <PatientInfoPanel patientData={patientData} loading={loadingData} />
                </div>

                <div className="md:col-span-1">
                    <h4 className="font-semibold mb-2">Generated Message</h4>
                    <textarea value={generatedMessage} readOnly rows={12} className="p-2 w-full bg-gray-50 border rounded-md text-sm" />
                    <button onClick={handleSend} className="mt-4 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300" disabled={!generatedMessage}>
                        Send via WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};