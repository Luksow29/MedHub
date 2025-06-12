import React, { useState, useEffect } from 'react';
import {
  VitalSign,
  NewDbVitalSign,
  UpdateDbVitalSign,
  TemperatureUnit, // TemperatureUnit ஐ நேரடியாக types/consultation.ts இலிருந்து இறக்குமதி செய்கிறோம்
  HeightUnit,
  WeightUnit,
} from '../../types/consultation'; // வகைகளை types/consultation இலிருந்து இறக்குமதி செய்கிறோம்
import Button from '../shared/Button';

interface VitalSignsFormProps {
  vitalSign?: VitalSign;
  consultationId: string;
  patientId: string;
  onSubmit: (data: NewDbVitalSign | UpdateDbVitalSign) => Promise<void>;
  onCancel: () => void;
}

const VitalSignsForm: React.FC<VitalSignsFormProps> = ({
  vitalSign,
  consultationId,
  patientId,
  onSubmit,
  onCancel
}) => {
  const [temperature, setTemperature] = useState<number | ''>(vitalSign?.temperature || '');
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(
    vitalSign?.temperatureUnit || TemperatureUnit.CELSIUS // சிறிய எழுத்துக்களில் உள்ள enum மதிப்பை பயன்படுத்துகிறோம்
  );
  const [heartRate, setHeartRate] = useState<number | ''>(vitalSign?.heartRate || '');
  const [respiratoryRate, setRespiratoryRate] = useState<number | ''>(vitalSign?.respiratoryRate || '');
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState<number | ''>(vitalSign?.bloodPressureSystolic || '');
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState<number | ''>(vitalSign?.bloodPressureDiastolic || '');
  const [oxygenSaturation, setOxygenSaturation] = useState<number | ''>(vitalSign?.oxygenSaturation || '');
  const [height, setHeight] = useState<number | ''>(vitalSign?.height || '');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(
    vitalSign?.heightUnit || HeightUnit.CM
  );
  const [weight, setWeight] = useState<number | ''>(vitalSign?.weight || '');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    vitalSign?.weightUnit || WeightUnit.KG
  );
  const [bmi, setBmi] = useState<number | ''>(vitalSign?.bmi || '');
  const [painScore, setPainScore] = useState<number | ''>(vitalSign?.painScore || '');
  const [notes, setNotes] = useState(vitalSign?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  // BMI கணக்கிடுவோம்
  useEffect(() => {
    if (height && weight) {
      let calculatedBmi: number;
      const heightInMeters = heightUnit === HeightUnit.CM ? Number(height) / 100 : Number(height) * 0.0254; // cm to m, in to m
      const weightInKg = weightUnit === WeightUnit.LBS ? Number(weight) * 0.453592 : Number(weight); // lbs to kg

      if (heightInMeters > 0) {
        calculatedBmi = weightInKg / (heightInMeters * heightInMeters);
        setBmi(parseFloat(calculatedBmi.toFixed(2)));
      } else {
        setBmi('');
      }
    } else {
      setBmi('');
    }
  }, [height, heightUnit, weight, weightUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const vitalSignData: NewDbVitalSign | UpdateDbVitalSign = {
        consultation_id: consultationId,
        patient_id: patientId,
        recorded_at: vitalSign?.recordedAt || new Date().toISOString(),
        temperature: temperature === '' ? null : Number(temperature),
        temperature_unit: temperatureUnit,
        heart_rate: heartRate === '' ? null : Number(heartRate),
        respiratory_rate: respiratoryRate === '' ? null : Number(respiratoryRate),
        blood_pressure_systolic: bloodPressureSystolic === '' ? null : Number(bloodPressureSystolic),
        blood_pressure_diastolic: bloodPressureDiastolic === '' ? null : Number(bloodPressureDiastolic),
        oxygen_saturation: oxygenSaturation === '' ? null : Number(oxygenSaturation),
        height: height === '' ? null : Number(height),
        height_unit: heightUnit,
        weight: weight === '' ? null : Number(weight),
        weight_unit: weightUnit,
        bmi: bmi === '' ? null : Number(bmi),
        pain_score: painScore === '' ? null : Number(painScore),
        notes: notes || null,
      };

      await onSubmit(vitalSignData);
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
          <label htmlFor="temperature" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Temperature", "வெப்பநிலை")}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="temperature"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value === '' ? '' : Number(e.target.value))}
              step="0.1"
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            <select
              value={temperatureUnit}
              onChange={(e) => setTemperatureUnit(e.target.value as TemperatureUnit)}
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm"
            >
              <option value={TemperatureUnit.CELSIUS}>{getBilingualLabel("Celsius", "செல்சியஸ்")}</option>
              <option value={TemperatureUnit.FAHRENHEIT}>{getBilingualLabel("Fahrenheit", "பாரன்ஹீட்")}</option>
            </select>
          </div>
        </div>

        {/* Heart Rate */}
        <div>
          <label htmlFor="heartRate" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Heart Rate (bpm)", "இதய துடிப்பு (bpm)")}
          </label>
          <input
            type="number"
            id="heartRate"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        {/* Respiratory Rate */}
        <div>
          <label htmlFor="respiratoryRate" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Respiratory Rate (breaths/min)", "சுவாச வீதம் (மூச்சுகள்/நிமிடம்)")}
          </label>
          <input
            type="number"
            id="respiratoryRate"
            value={respiratoryRate}
            onChange={(e) => setRespiratoryRate(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        {/* Blood Pressure */}
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Blood Pressure (mmHg)", "இரத்த அழுத்தம் (mmHg)")}
          </label>
          <div className="mt-1 flex space-x-2">
            <input
              type="number"
              id="bpSystolic"
              value={bloodPressureSystolic}
              onChange={(e) => setBloodPressureSystolic(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={getBilingualLabel("Systolic", "சிஸ்டாலிக்")}
              className="flex-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            <span className="self-center text-slate-500">/</span>
            <input
              type="number"
              id="bpDiastolic"
              value={bloodPressureDiastolic}
              onChange={(e) => setBloodPressureDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={getBilingualLabel("Diastolic", "டயாஸ்டாலிக்")}
              className="flex-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Oxygen Saturation */}
        <div>
          <label htmlFor="oxygenSaturation" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Oxygen Saturation (%)", "ஆக்ஸிஜன் செறிவூட்டல் (%)")}
          </label>
          <input
            type="number"
            id="oxygenSaturation"
            value={oxygenSaturation}
            onChange={(e) => setOxygenSaturation(e.target.value === '' ? '' : Number(e.target.value))}
            min="0"
            max="100"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        {/* Height */}
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Height", "உயரம்")}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
              step="0.1"
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            <select
              value={heightUnit}
              onChange={(e) => setHeightUnit(e.target.value as HeightUnit)}
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm"
            >
              <option value={HeightUnit.CM}>{getBilingualLabel("cm", "செ.மீ")}</option>
              <option value={HeightUnit.IN}>{getBilingualLabel("in", "அங்குலம்")}</option>
            </select>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Weight", "எடை")}
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
              step="0.1"
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
              className="rounded-none rounded-r-md border-l-0 border-slate-300 bg-slate-50 text-slate-900 sm:text-sm"
            >
              <option value={WeightUnit.KG}>{getBilingualLabel("kg", "கிலோ")}</option>
              <option value={WeightUnit.LBS}>{getBilingualLabel("lbs", "பவுண்டுகள்")}</option>
            </select>
          </div>
        </div>

        {/* BMI */}
        <div>
          <label htmlFor="bmi" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("BMI", "பிஎம்ஐ")}
          </label>
          <input
            type="text" // Display as text as it's calculated
            id="bmi"
            value={bmi}
            readOnly
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 cursor-not-allowed sm:text-sm"
          />
        </div>

        {/* Pain Score */}
        <div>
          <label htmlFor="painScore" className="block text-sm font-medium text-slate-700">
            {getBilingualLabel("Pain Score (0-10)", "வலிப் புள்ளி (0-10)")}
          </label>
          <input
            type="number"
            id="painScore"
            value={painScore}
            onChange={(e) => setPainScore(e.target.value === '' ? '' : Number(e.target.value))}
            min="0"
            max="10"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          {getBilingualLabel("Notes (Optional)", "குறிப்புகள் (விருப்பமானது)")}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {vitalSign?.id ?
            getBilingualLabel("Update Vital Signs", "முக்கிய அறிகுறிகளைப் புதுப்பிக்கவும்") :
            getBilingualLabel("Add Vital Signs", "முக்கிய அறிகுறிகளைச் சேர்")
          }
        </Button>
      </div>
    </form>
  );
};

export default VitalSignsForm;
