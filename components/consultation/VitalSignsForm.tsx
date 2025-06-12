import React, { useState } from 'react';
import { 
  VitalSigns, 
  NewDbVitalSigns, 
  UpdateDbVitalSigns,
  TemperatureUnit,
  HeightUnit,
  WeightUnit
} from '../../types';
import Button from '../shared/Button';

interface VitalSignsFormProps {
  vitalSigns?: VitalSigns;
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
  const [temperature, setTemperature] = useState<number | null>(vitalSigns?.temperature || null);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(
    vitalSigns?.temperatureUnit || TemperatureUnit.CELSIUS
  );
  const [heartRate, setHeartRate] = useState<number | null>(vitalSigns?.heartRate || null);
  const [respiratoryRate, setRespiratoryRate] = useState<number | null>(vitalSigns?.respiratoryRate || null);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState<number | null>(
    vitalSigns?.bloodPressureSystolic || null
  );
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState<number | null>(
    vitalSigns?.bloodPressureDiastolic || null
  );
  const [oxygenSaturation, setOxygenSaturation] = useState<number | null>(vitalSigns?.oxygenSaturation || null);
  const [height, setHeight] = useState<number | null>(vitalSigns?.height || null);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(vitalSigns?.heightUnit || HeightUnit.CM);
  const [weight, setWeight] = useState<number | null>(vitalSigns?.weight || null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(vitalSigns?.weightUnit || WeightUnit.KG);
  const [painScore, setPainScore] = useState<number | null>(vitalSigns?.painScore || null);
  const [notes, setNotes] = useState(vitalSigns?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBilingualLabel = (english: string, tamil: string) => `${english} (${tamil})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const vitalSignsData: NewDbVitalSigns | UpdateDbVitalSigns = {
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
        pain_score: painScore,
        notes: notes || null
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Temperature */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <label htmlFor="temperature" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Temperature", "வெப்பநிலை")}
              </label>
              <input
                type="number"
                id="temperature"
                value={temperature === null ? '' : temperature}
                onChange={(e) => setTemperature(e.target.value ? parseFloat(e.target.value) : null)}
                step="0.1"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
            <div className="w-24">
              <label htmlFor="temperatureUnit" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Unit", "அலகு")}
              </label>
              <select
                id="temperatureUnit"
                value={temperatureUnit}
                onChange={(e) => setTemperatureUnit(e.target.value as TemperatureUnit)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value={TemperatureUnit.CELSIUS}>{getBilingualLabel("Celsius", "செல்சியஸ்")}</option>
                <option value={TemperatureUnit.FAHRENHEIT}>{getBilingualLabel("Fahrenheit", "ஃபாரன்ஹீட்")}</option>
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
              value={heartRate === null ? '' : heartRate}
              onChange={(e) => setHeartRate(e.target.value ? parseInt(e.target.value) : null)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          
          {/* Respiratory Rate */}
          <div>
            <label htmlFor="respiratoryRate" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Respiratory Rate (breaths/min)", "சுவாச விகிதம் (மூச்சுகள்/நிமிடம்)")}
            </label>
            <input
              type="number"
              id="respiratoryRate"
              value={respiratoryRate === null ? '' : respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.target.value ? parseInt(e.target.value) : null)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          
          {/* Blood Pressure */}
          <div>
            <label htmlFor="bloodPressureSystolic" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Blood Pressure (mmHg)", "இரத்த அழுத்தம் (mmHg)")}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                id="bloodPressureSystolic"
                value={bloodPressureSystolic === null ? '' : bloodPressureSystolic}
                onChange={(e) => setBloodPressureSystolic(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Systolic"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
              <span className="text-slate-500">/</span>
              <input
                type="number"
                id="bloodPressureDiastolic"
                value={bloodPressureDiastolic === null ? '' : bloodPressureDiastolic}
                onChange={(e) => setBloodPressureDiastolic(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Diastolic"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
          </div>
          
          {/* Oxygen Saturation */}
          <div>
            <label htmlFor="oxygenSaturation" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Oxygen Saturation (%)", "ஆக்ஸிஜன் செறிவு (%)")}
            </label>
            <input
              type="number"
              id="oxygenSaturation"
              value={oxygenSaturation === null ? '' : oxygenSaturation}
              onChange={(e) => setOxygenSaturation(e.target.value ? parseInt(e.target.value) : null)}
              min="0"
              max="100"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {/* Height */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <label htmlFor="height" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Height", "உயரம்")}
              </label>
              <input
                type="number"
                id="height"
                value={height === null ? '' : height}
                onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : null)}
                step="0.1"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
            <div className="w-24">
              <label htmlFor="heightUnit" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Unit", "அலகு")}
              </label>
              <select
                id="heightUnit"
                value={heightUnit}
                onChange={(e) => setHeightUnit(e.target.value as HeightUnit)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value={HeightUnit.CM}>{getBilingualLabel("cm", "செ.மீ")}</option>
                <option value={HeightUnit.IN}>{getBilingualLabel("in", "அங்குலம்")}</option>
              </select>
            </div>
          </div>
          
          {/* Weight */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <label htmlFor="weight" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Weight", "எடை")}
              </label>
              <input
                type="number"
                id="weight"
                value={weight === null ? '' : weight}
                onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : null)}
                step="0.1"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
            <div className="w-24">
              <label htmlFor="weightUnit" className="block text-sm font-medium text-slate-700">
                {getBilingualLabel("Unit", "அலகு")}
              </label>
              <select
                id="weightUnit"
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value={WeightUnit.KG}>{getBilingualLabel("kg", "கிலோ")}</option>
                <option value={WeightUnit.LB}>{getBilingualLabel("lb", "பவுண்டு")}</option>
              </select>
            </div>
          </div>
          
          {/* BMI Display */}
          {height && weight && (
            <div className="bg-slate-50 p-3 rounded-md">
              <p className="text-sm font-medium text-slate-700">
                {getBilingualLabel("BMI", "உடல் நிறை குறியீடு")}: 
                <span className="ml-2 font-bold">
                  {calculateBMI(height, heightUnit, weight, weightUnit).toFixed(1)}
                </span>
              </p>
            </div>
          )}
          
          {/* Pain Score */}
          <div>
            <label htmlFor="painScore" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Pain Score (0-10)", "வலி மதிப்பெண் (0-10)")}
            </label>
            <input
              type="number"
              id="painScore"
              value={painScore === null ? '' : painScore}
              onChange={(e) => setPainScore(e.target.value ? parseInt(e.target.value) : null)}
              min="0"
              max="10"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            {painScore !== null && (
              <div className="mt-2 flex items-center">
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getPainScoreColor(painScore)}`} 
                    style={{ width: `${(painScore / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium text-slate-700">{getPainScoreLabel(painScore)}</span>
              </div>
            )}
          </div>
          
          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              {getBilingualLabel("Notes", "குறிப்புகள்")}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {getBilingualLabel("Cancel", "ரத்துசெய்")}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {vitalSigns?.id ? 
            getBilingualLabel("Update Vital Signs", "உயிர் அறிகுறிகளைப் புதுப்பிக்கவும்") : 
            getBilingualLabel("Save Vital Signs", "உயிர் அறிகுறிகளைச் சேமிக்கவும்")
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
  // Convert height to meters
  const heightInMeters = heightUnit === HeightUnit.CM ? height / 100 : height * 0.0254;
  
  // Convert weight to kg
  const weightInKg = weightUnit === WeightUnit.KG ? weight : weight * 0.453592;
  
  // Calculate BMI
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