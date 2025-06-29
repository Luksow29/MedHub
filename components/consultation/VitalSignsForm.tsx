import React, { useState, useEffect } from 'react';
import {
  VitalSign,
  NewDbVitalSigns,
  UpdateDbVitalSigns,
  TemperatureUnit,
  HeightUnit,
  WeightUnit,
} from '../../types/consultation';
import Button from '../shared/Button';

interface VitalSignsFormProps {
  vitalSigns?: VitalSign;
  consultationId: string;
  patientId: string;
  onSubmit: (data: NewDbVitalSigns | UpdateDbVitalSigns) => Promise<void>;
  onCancel: () => void;
}

const VitalSignsForm: React.FC<VitalSignsFormProps> = ({
  vitalSigns,
  consultationId,
  patientId,
  onSubmit,
  onCancel,
}) => {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(TemperatureUnit.CELSIUS);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [respiratoryRate, setRespiratoryRate] = useState<number | null>(null);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState<number | null>(null);
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState<number | null>(null);
  const [oxygenSaturation, setOxygenSaturation] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(HeightUnit.CM);
  const [weight, setWeight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(WeightUnit.KG);
  const [bmi, setBmi] = useState<number | null>(null);
  const [painScore, setPainScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  useEffect(() => {
    setTemperature(vitalSigns?.temperature ?? null);
    setTemperatureUnit(vitalSigns?.temperatureUnit || TemperatureUnit.CELSIUS);
    setHeartRate(vitalSigns?.heartRate ?? null);
    setRespiratoryRate(vitalSigns?.respiratoryRate ?? null);
    setBloodPressureSystolic(vitalSigns?.bloodPressureSystolic ?? null);
    setBloodPressureDiastolic(vitalSigns?.bloodPressureDiastolic ?? null);
    setOxygenSaturation(vitalSigns?.oxygenSaturation ?? null);
    setHeight(vitalSigns?.height ?? null);
    setHeightUnit(vitalSigns?.heightUnit || HeightUnit.CM);
    setWeight(vitalSigns?.weight ?? null);
    setWeightUnit(vitalSigns?.weightUnit || WeightUnit.KG);
    setBmi(vitalSigns?.bmi ?? null);
    setPainScore(vitalSigns?.painScore ?? null);
    setNotes(vitalSigns?.notes || '');
    setError(null);
  }, [vitalSigns]);

  useEffect(() => {
    if (height !== null && weight !== null && height > 0 && weight > 0) {
      const heightInMeters = heightUnit === HeightUnit.CM ? height / 100 : height * 0.0254;
      const weightInKg = weightUnit === WeightUnit.LB ? weight * 0.453592 : weight;
      if (heightInMeters > 0) {
        const calculatedBmi = weightInKg / (heightInMeters * heightInMeters);
        setBmi(parseFloat(calculatedBmi.toFixed(2)));
      }
    } else {
      setBmi(null);
    }
  }, [height, heightUnit, weight, weightUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const vitalSignsData = {
        consultation_id: consultationId,
        patient_id: patientId,
        temperature,
        temperature_unit: temperatureUnit,
        heart_rate: heartRate,
        respiratory_rate: respiratoryRate,
        blood_pressure_systolic: bloodPressureSystolic,
        blood_pressure_diastolic: bloodPressureDiastolic,
        oxygen_saturation: oxygenSaturation,
        height,
        height_unit: heightUnit,
        weight,
        weight_unit: weightUnit,
        bmi,
        pain_score: painScore,
        notes: notes || null,
      };
      await onSubmit(vitalSignsData);
    } catch (err: any) {
      console.error('Error submitting vital signs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white w-full max-h-[90vh] overflow-y-auto space-y-6"
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Grid for responsive layout. 1 col on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
        
        {/* Temperature */}
        <div className="col-span-1">
          <label htmlFor="temperature" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Temperature", "வெப்பநிலை")}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="temperature"
              value={temperature === null ? '' : temperature}
              onChange={(e) => setTemperature(e.target.value === '' ? null : Number(e.target.value))}
              step="0.1"
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
            />
            <select
              value={temperatureUnit}
              onChange={(e) => setTemperatureUnit(e.target.value as TemperatureUnit)}
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm p-2 flex-shrink-0 min-w-max"
            >
              <option value={TemperatureUnit.CELSIUS}>°C</option>
              <option value={TemperatureUnit.FAHRENHEIT}>°F</option>
            </select>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="col-span-1">
          <label htmlFor="heartRate" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Heart Rate", "இதய துடிப்பு")}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
             <input
              type="number"
              id="heartRate"
              value={heartRate === null ? '' : heartRate}
              onChange={(e) => setHeartRate(e.target.value === '' ? null : Number(e.target.value))}
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
            />
             <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                bpm
            </span>
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className="col-span-1">
          <label htmlFor="respiratoryRate" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Respiratory Rate", "சுவாச வீதம்")}
          </label>
           <div className="mt-1 flex rounded-md shadow-sm">
                <input
                    type="number"
                    id="respiratoryRate"
                    value={respiratoryRate === null ? '' : respiratoryRate}
                    onChange={(e) => setRespiratoryRate(e.target.value === '' ? null : Number(e.target.value))}
                    className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                    breaths/min
                </span>
            </div>
        </div>
        
        {/* Blood Pressure - Responsive layout */}
        <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Blood Pressure", "இரத்த அழுத்தம்")}
                 <span className="text-xs text-slate-500 ml-1">(mmHg)</span>
            </label>
            {/* On mobile, fields are stacked. On medium screens+, they are side-by-side. */}
            <div className="mt-1 flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0">
                <input
                    type="number"
                    id="bpSystolic"
                    value={bloodPressureSystolic === null ? '' : bloodPressureSystolic}
                    onChange={(e) => setBloodPressureSystolic(e.target.value === '' ? null : Number(e.target.value))}
                    placeholder={getBilingualLabel("Systolic", "சிஸ்டாலிக்")}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
                />
                <span className="self-center text-slate-500 hidden md:block">/</span>
                <input
                    type="number"
                    id="bpDiastolic"
                    value={bloodPressureDiastolic === null ? '' : bloodPressureDiastolic}
                    onChange={(e) => setBloodPressureDiastolic(e.target.value === '' ? null : Number(e.target.value))}
                    placeholder={getBilingualLabel("Diastolic", "டயாஸ்டாலிக்")}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
                />
            </div>
        </div>
        
        {/* Oxygen Saturation */}
        <div className="col-span-1">
          <label htmlFor="oxygenSaturation" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Oxygen Saturation", "ஆக்ஸிஜன் செறிவூட்டல்")}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="oxygenSaturation"
              value={oxygenSaturation === null ? '' : oxygenSaturation}
              onChange={(e) => setOxygenSaturation(e.target.value === '' ? null : Number(e.target.value))}
              min="0"
              max="100"
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                %
            </span>
          </div>
        </div>

        {/* Height */}
        <div className="col-span-1">
          <label htmlFor="height" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Height", "உயரம்")}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="height"
              value={height === null ? '' : height}
              onChange={(e) => setHeight(e.target.value === '' ? null : Number(e.target.value))}
              step="0.1"
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
            />
            <select
              value={heightUnit}
              onChange={(e) => setHeightUnit(e.target.value as HeightUnit)}
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm p-2 flex-shrink-0 min-w-max"
            >
              <option value={HeightUnit.CM}>{getBilingualLabel("cm", "செ.மீ")}</option>
              <option value={HeightUnit.IN}>{getBilingualLabel("in", "அங்குலம்")}</option>
            </select>
          </div>
        </div>

        {/* Weight */}
        <div className="col-span-1">
          <label htmlFor="weight" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Weight", "எடை")}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="weight"
              value={weight === null ? '' : weight}
              onChange={(e) => setWeight(e.target.value === '' ? null : Number(e.target.value))}
              step="0.1"
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
            />
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm p-2 flex-shrink-0 min-w-max"
            >
              <option value={WeightUnit.KG}>{getBilingualLabel("kg", "கிலோ")}</option>
              <option value={WeightUnit.LB}>{getBilingualLabel("lbs", "பவுண்டுகள்")}</option>
            </select>
          </div>
        </div>
        
        {/* BMI */}
        <div className="col-span-1">
          <label htmlFor="bmi" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("BMI", "உடல் நிறை குறியீடு")}
          </label>
          <input
            type="text"
            id="bmi"
            value={bmi === null ? '' : bmi}
            readOnly
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 cursor-not-allowed sm:text-sm p-2"
          />
        </div>

        {/* Pain Score */}
        <div className="col-span-1">
            <label htmlFor="painScore" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Pain Score (0-10)", "வலிப் புள்ளி (0-10)")}
            </label>
            <input
                type="number"
                id="painScore"
                value={painScore === null ? '' : painScore}
                onChange={(e) => setPainScore(e.target.value === '' ? null : Number(e.target.value))}
                min="0"
                max="10"
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
            />
        </div>
      </div>

      {/* Notes */}
      <div className="col-span-full">
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Notes (Optional)", "குறிப்புகள் (விருப்பமானது)")}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {vitalSigns?.id ?
            getBilingualLabel("Update Vital Signs", "அறிகுறிகளைப் புதுப்பிக்கவும்") :
            getBilingualLabel("Add Vital Signs", "அறிகுறிகளைச் சேர்")
          }
        </Button>
      </div>
    </form>
  );
};

export default VitalSignsForm;