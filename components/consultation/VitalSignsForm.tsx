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
  onCancel
}) => {
  const [temperature, setTemperature] = useState<number | null>(vitalSigns?.temperature ?? null);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(
    vitalSigns?.temperatureUnit || TemperatureUnit.CELSIUS
  );
  const [heartRate, setHeartRate] = useState<number | null>(vitalSigns?.heartRate ?? null);
  const [respiratoryRate, setRespiratoryRate] = useState<number | null>(vitalSigns?.respiratoryRate ?? null);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState<number | null>(
    vitalSigns?.bloodPressureSystolic ?? null
  );
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState<number | null>(
    vitalSigns?.bloodPressureDiastolic ?? null
  );
  const [oxygenSaturation, setOxygenSaturation] = useState<number | null>(vitalSigns?.oxygenSaturation ?? null);
  const [height, setHeight] = useState<number | null>(vitalSigns?.height ?? null);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(vitalSigns?.heightUnit || HeightUnit.CM);
  const [weight, setWeight] = useState<number | null>(vitalSigns?.weight ?? null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(vitalSigns?.weightUnit || WeightUnit.KG);
  const [bmi, setBmi] = useState<number | null>(vitalSigns?.bmi ?? null);
  const [painScore, setPainScore] = useState<number | null>(vitalSigns?.painScore ?? null);
  const [notes, setNotes] = useState(vitalSigns?.notes || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // BMI கணக்கிடுவோம்
  useEffect(() => {
    if (height !== null && weight !== null) {
      let calculatedBmi: number;
      if (Number(height) > 0 && Number(weight) > 0) {
        const heightInMeters = heightUnit === HeightUnit.CM ? Number(height) / 100 : Number(height) * 0.0254;
        const weightInKg = weightUnit === WeightUnit.LBS ? Number(weight) * 0.453592 : Number(weight);

        if (heightInMeters > 0) {
          calculatedBmi = weightInKg / (heightInMeters * heightInMeters);
          setBmi(parseFloat(calculatedBmi.toFixed(2)));
        } else {
          setBmi(null);
        }
      } else {
        setBmi(null);
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
      const vitalSignsData: NewDbVitalSigns | UpdateDbVitalSigns = {
        consultation_id: consultationId,
        patient_id: patientId,
        temperature: temperature,
        temperature_unit: temperatureUnit,
        heart_rate: heartRate,
        respiratory_rate: respiratoryRate,
        blood_pressure_systolic: bloodPressureSystolic,
        blood_pressure_diastolic: bloodPressureDiastolic,
        oxygen_saturation: oxygenSaturation,
        height: height,
        height_unit: heightUnit,
        weight: weight,
        weight_unit: weightUnit,
        bmi: bmi,
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
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white rounded-lg shadow">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Temperature */}
        <div>
          <label htmlFor="temperature" className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("Temperature", "வெப்பநிலை")}
          </label>
          {/* Tamil label for Celsius/Fahrenheit */}
          <span className="block text-xs text-slate-500 pt-0.5 pb-2">
            {getBilingualLabel("Celsius", "செல்சியஸ்")}/{getBilingualLabel("Fahrenheit", "பாரன்ஹீட்")}
          </span>
          <div className="flex rounded-md shadow-sm mt-0.5">
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
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm p-2 flex-shrink-0"
            >
              <option value={TemperatureUnit.CELSIUS}>{getBilingualLabel("Celsius", "செல்சியஸ்")}</option>
              <option value={TemperatureUnit.FAHRENHEIT}>{getBilingualLabel("Fahrenheit", "பாரன்ஹீட்")}</option>
            </select>
          </div>
        </div>

        {/* Heart Rate */}
        <div>
          <label htmlFor="heartRate" className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("Heart Rate", "இதய துடிப்பு")}
          </label>
          <span className="block text-xs text-slate-500 pt-0.5 pb-2">{getBilingualLabel("bpm", "bpm")}</span>
          <input
            type="number"
            id="heartRate"
            value={heartRate === null ? '' : heartRate}
            onChange={(e) => setHeartRate(e.target.value === '' ? null : Number(e.target.value))}
            className="flex w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2 mt-0.5"
          />
        </div>

        {/* Respiratory Rate */}
        <div>
          <label htmlFor="respiratoryRate" className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("Respiratory Rate", "சுவாச வீதம்")}
          </label>
          <span className="block text-xs text-slate-500 pt-0.5 pb-2">{getBilingualLabel("breaths/min", "மூச்சுகள்/நிமிடம்")}</span>
          <input
            type="number"
            id="respiratoryRate"
            value={respiratoryRate === null ? '' : respiratoryRate}
            onChange={(e) => setRespiratoryRate(e.target.value === '' ? null : Number(e.target.value))}
            className="flex w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2 mt-0.5"
          />
        </div>

        {/* Blood Pressure */}
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("Blood Pressure", "இரத்த அழுத்தம்")}
          </label>
          <span className="block text-xs text-slate-500 pt-0.5 pb-2">{getBilingualLabel("mmHg", "mmHg")}</span>
          <div className="flex space-x-2 mt-0.5">
            <input
              type="number"
              id="bpSystolic"
              value={bloodPressureSystolic === null ? '' : bloodPressureSystolic}
              onChange={(e) => setBloodPressureSystolic(e.target.value === '' ? null : Number(e.target.value))}
              placeholder={getBilingualLabel("Systolic", "சிஸ்டாலிக்")}
              className="flex-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
            />
            <span className="self-center text-slate-500 px-1">/</span>
            <input
              type="number"
              id="bpDiastolic"
              value={bloodPressureDiastolic === null ? '' : bloodPressureDiastolic}
              onChange={(e) => setBloodPressureDiastolic(e.target.value === '' ? null : Number(e.target.value))}
              placeholder={getBilingualLabel("Diastolic", "டயாஸ்டாலிக்")}
              className="flex-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
            />
          </div>
        </div>

        {/* Oxygen Saturation */}
        <div>
          <label htmlFor="oxygenSaturation" className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("Oxygen Saturation", "ஆக்ஸிஜன் செறிவூட்டல்")}
          </label>
          <span className="block text-xs text-slate-500 pt-0.5 pb-2">{getBilingualLabel("%", "%")}</span>
          <input
            type="number"
            id="oxygenSaturation"
            value={oxygenSaturation === null ? '' : oxygenSaturation}
            onChange={(e) => setOxygenSaturation(e.target.value === '' ? null : Number(e.target.value))}
            min="0"
            max="100"
            className="flex w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2 mt-0.5"
          />
        </div>

        {/* Height */}
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("Height", "உயரம்")}
          </label>
          <div className="mt-0.5 flex rounded-md shadow-sm">
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
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm p-2 flex-shrink-0"
            >
              <option value={HeightUnit.CM}>{getBilingualLabel("cm", "செ.மீ")}</option>
              <option value={HeightUnit.IN}>{getBilingualLabel("in", "அங்குலம்")}</option>
            </select>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("Weight", "எடை")}
          </label>
          <div className="mt-0.5 flex rounded-md shadow-sm">
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
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm p-2 flex-shrink-0"
            >
              <option value={WeightUnit.KG}>{getBilingualLabel("kg", "கிலோ")}</option>
              <option value={WeightUnit.LBS}>{getBilingualLabel("lbs", "பவுண்டுகள்")}</option>
            </select>
          </div>
        </div>

        {/* BMI */}
        <div>
          <label htmlFor="bmi" className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("BMI", "பிஎம்ஐ")}
          </label>
          <input
            type="text"
            id="bmi"
            value={bmi === null ? '' : bmi}
            readOnly
            className="mt-0.5 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 cursor-not-allowed sm:text-sm p-2"
          />
        </div>

        {/* Pain Score */}
        <div>
          <label htmlFor="painScore" className="block text-sm font-medium text-slate-700 pb-1">
            {getBilingualLabel("Pain Score", "வலிப் புள்ளி")}
          </label>
          <span className="block text-xs text-slate-500 pt-0.5 pb-2">{getBilingualLabel("(0-10)", "(0-10)")}</span>
          <input
            type="number"
            id="painScore"
            value={painScore === null ? '' : painScore}
            onChange={(e) => setPainScore(e.target.value === '' ? null : Number(e.target.value))}
            min="0"
            max="10"
            className="mt-0.5 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 pb-1">
          {getBilingualLabel("Notes (Optional)", "குறிப்புகள் (விருப்பமானது)")}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-0.5 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm p-2"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {vitalSigns?.id ?
            getBilingualLabel("Update Vital Signs", "முக்கிய அறிகுறிகளைப் புதுப்பிக்கவும்") :
            getBilingualLabel("Add Vital Signs", "முக்கிய அறிகுறிகளைச் சேர்")
          }
        </Button>
      </div>
    </form>
  );
};

// Helper function to calculate BMI
const calculateBMI = (
  height: number,
  heightUnit: HeightUnit,
  weight: number,
  weightUnit: WeightUnit
): number => {
  // height மற்றும் weight பூஜ்ஜியத்தை விட அதிகமாக இருப்பதை உறுதி செய்கிறோம்
  if (height <= 0 || weight <= 0) {
    return 0; // Invalid input for BMI calculation
  }

  // Convert height to meters
  const heightInMeters = heightUnit === HeightUnit.CM ? height / 100 : height * 0.0254;

  // Convert weight to kg
  const weightInKg = weightUnit === WeightUnit.KG ? weight : weight * 0.453592;

  // Calculate BMI
  if (heightInMeters === 0) { // Avoid division by zero
    return 0;
  }
  return weightInKg / (heightInMeters * heightInMeters);
};

// Helper function to get pain score color
const getPainScoreColor = (painScore: number): string => {
  if (painScore <= 3) return 'bg-green-500';
  if (painScore <= 6) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Helper function to get pain score label
const getPainScoreLabel = (painScore: number): string => {
  if (painScore <= 3) return 'Mild';
  if (painScore <= 6) return 'Moderate';
  return 'Severe';
};

export default VitalSignsForm;