import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import { SurveyData, MetaOption } from '../types';
import { api } from '../services/api';
import { DatePicker } from './DatePicker';
import { SearchableDropdown } from './SearchableDropdown';

interface PreliminaryStepProps {
  formData: SurveyData;
  authToken: string | null;
  updateField: (field: keyof SurveyData, value: any) => void;
  currentUserHasAgentId: boolean;
}

export const PreliminaryStep: React.FC<PreliminaryStepProps> = ({ formData, authToken, updateField, currentUserHasAgentId }) => {
  const [npnLoading, setNpnLoading] = useState(false);
  const [npnError, setNpnError] = useState<string | null>(null);
  const [trainerNpnLoading, setTrainerNpnLoading] = useState(false);
  const [trainerNpnError, setTrainerNpnError] = useState<string | null>(null);
  const [types, setTypes] = useState<MetaOption[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [previousTypeName, setPreviousTypeName] = useState<string>(formData.typeName);

  useEffect(() => {
    const fetchTypes = async () => {
      if (!authToken) return;
      try {
        const fetchedTypes = await api.getContactTypes(authToken);
        setTypes(fetchedTypes);
      } catch (error) {
        console.error("Failed to fetch types", error);
      } finally {
        setTypesLoading(false);
      }
    };

    fetchTypes();
  }, [authToken]);

  const handleNpnValidation = async () => {
    if (!authToken || !formData.submissionAgentNpn) return;
    setNpnLoading(true); setNpnError(null);
    try {
      const result = await api.validateAgent(authToken, formData.submissionAgentNpn);
      updateField('submissionAgentId', result.agent_id);
      updateField('submissionAgentName', result.agent_name);
    } catch (err) {
      setNpnError('Invalid NPN.');
      updateField('submissionAgentId', ''); updateField('submissionAgentName', '');
    } finally { setNpnLoading(false); }
  };

  const handleTrainerNpnValidation = async () => {
    if (!authToken || !formData.trainerNpn) return;
    setTrainerNpnLoading(true); setTrainerNpnError(null);
    try {
      const result = await api.validateAgent(authToken, formData.trainerNpn);
      updateField('trainerAgentId', result.agent_id);
      updateField('trainerAgentName', result.agent_name);
    } catch (err) {
      setTrainerNpnError('Invalid NPN.');
      updateField('trainerAgentId', ''); updateField('trainerAgentName', '');
    } finally { setTrainerNpnLoading(false); }
  };

  const clearTrainerFields = () => {
    updateField('trainerNpn', '');
    updateField('trainerAgentId', '');
    updateField('trainerAgentName', '');
    setTrainerNpnError(null);
  };

  const handleTypeChange = (opt: MetaOption) => {
    const newTypeName = opt.name;
    const wasAnnuity = previousTypeName.toLowerCase().includes('annuity');
    const isNowAnnuity = newTypeName.toLowerCase().includes('annuity');
    
    // If switching between annuity and non-annuity, reset subsequent steps
    if (wasAnnuity !== isNowAnnuity && previousTypeName !== '') {
      // Reset STEP 3/6 - Client Info (keep policyHolder, reset state and source)
      updateField('state', '');
      updateField('sourceId', '');
      updateField('sourceName', '');
      
      // Reset STEP 4/6 - Policy Info
      updateField('policyNumber', 'NA');
      updateField('carrierId', '');
      updateField('carrierName', '');
      updateField('product', '');
      updateField('initialDraftDate', '');
      updateField('recurringDraftDay', '');
      updateField('faceAmount', '');
      updateField('beneficiary', '');
      updateField('monthlyPremium', '');
      updateField('annualPremium', '');
      updateField('transferAmount', '');
      updateField('clientAge', '');
      updateField('lengthOfAnnuity', '');
      
      // Reset STEP 5/6 - Splits
      updateField('splits', []);
      
      // Reset STEP 6/6 - Conclusion
      updateField('statusId', '');
      updateField('statusName', '');
      updateField('pendingFollowUp', '');
      updateField('appointmentHighlights', 'NA');
    }
    
    // Update the type
    updateField('typeId', opt.id);
    updateField('typeName', newTypeName);
    setPreviousTypeName(newTypeName);
  };

  const getLocalTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const closeTypes = ['One Call Close', 'Appointment', 'Call In', 'Follow Up'];

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black font-black text-[9px]">1</span>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Your own sale?*</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateField('isOwnSale', true)}
            disabled={!currentUserHasAgentId}
            className={`py-2 px-3 rounded-lg font-bold transition-all border-2 text-xs ${
              formData.isOwnSale 
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-400' 
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
            }`}
          >Yes, mine</button>
          <button
            onClick={() => { updateField('isOwnSale', false); updateField('submissionAgentId', ''); updateField('submissionAgentName', ''); }}
            className={`py-2 px-3 rounded-lg font-bold transition-all border-2 text-xs ${
              !formData.isOwnSale 
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-400' 
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
            }`}
          >Another agent</button>
        </div>

        {!formData.isOwnSale && (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Writing Agent NPN *</label>
            <div className="flex gap-2">
              <input
                type="number" value={formData.submissionAgentNpn}
                onChange={(e) => { updateField('submissionAgentNpn', e.target.value); setNpnError(null); }}
                className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-xs bg-white dark:bg-gray-800"
                placeholder="Enter NPN"
              />
              <button
                onClick={handleNpnValidation}
                disabled={npnLoading || !formData.submissionAgentNpn || !!formData.submissionAgentId}
                className={`px-4 rounded-lg text-xs font-bold transition-all ${
                  formData.submissionAgentId ? 'bg-green-500 text-white' : 'bg-black dark:bg-white text-white dark:text-black'
                }`}
              >
                {npnLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : formData.submissionAgentId ? <CheckCircle2 className="w-3.5 h-3.5" /> : 'Validate'}
              </button>
            </div>
            {npnError && <p className="text-red-500 text-[10px] mt-1.5 font-medium">{npnError}</p>}
            {formData.submissionAgentName && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900 text-green-700 dark:text-green-400 text-[10px] font-bold flex items-center gap-1.5">
                <UserCheck className="w-3 h-3" /> {formData.submissionAgentName}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black font-black text-[9px]">2</span>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Did a trainer help you place this sale?*</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateField('trainerAssisted', true)}
            className={`py-2 px-3 rounded-lg font-bold transition-all border-2 text-xs ${
              formData.trainerAssisted 
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-400' 
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
            }`}
          >Yes</button>
          <button
            onClick={() => { updateField('trainerAssisted', false); clearTrainerFields(); }}
            className={`py-2 px-3 rounded-lg font-bold transition-all border-2 text-xs ${
              !formData.trainerAssisted 
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-400' 
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
            }`}
          >No</button>
        </div>

        {formData.trainerAssisted && (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Trainer NPN *</label>
            <div className="flex gap-2">
              <input
                type="number" value={formData.trainerNpn}
                onChange={(e) => { updateField('trainerNpn', e.target.value); updateField('trainerAgentId', ''); updateField('trainerAgentName', ''); setTrainerNpnError(null); }}
                className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-xs bg-white dark:bg-gray-800"
                placeholder="Enter Trainer NPN"
              />
              <button
                onClick={handleTrainerNpnValidation}
                disabled={trainerNpnLoading || !formData.trainerNpn || !!formData.trainerAgentId}
                className={`px-4 rounded-lg text-xs font-bold transition-all ${
                  formData.trainerAgentId ? 'bg-green-500 text-white' : 'bg-black dark:bg-white text-white dark:text-black'
                }`}
              >
                {trainerNpnLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : formData.trainerAgentId ? <CheckCircle2 className="w-3.5 h-3.5" /> : 'Validate'}
              </button>
            </div>
            {trainerNpnError && <p className="text-red-500 text-[10px] mt-1.5 font-medium">{trainerNpnError}</p>}
            {formData.trainerAgentName && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900 text-green-700 dark:text-green-400 text-[10px] font-bold flex items-center gap-1.5">
                <UserCheck className="w-3 h-3" /> {formData.trainerAgentName}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black font-black text-[9px]">3</span>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Created today?*</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { updateField('isPolicyCreatedToday', true); updateField('policyCreatedDate', getLocalTodayString()); }}
            className={`py-2 px-3 rounded-lg font-bold border-2 text-xs transition-all ${
              formData.isPolicyCreatedToday 
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-400' 
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
            }`}
          >Yes, today</button>
          <button
            onClick={() => updateField('isPolicyCreatedToday', false)}
            className={`py-2 px-3 rounded-lg font-bold border-2 text-xs transition-all ${
              !formData.isPolicyCreatedToday 
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-400' 
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
            }`}
          >Select date</button>
        </div>
        {!formData.isPolicyCreatedToday && (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <DatePicker selectedDate={formData.policyCreatedDate} onChange={(d) => updateField('policyCreatedDate', d)} />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black font-black text-[9px]">4</span>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Policy Type*</h3>
        </div>
        <SearchableDropdown
          label="Type*"
          tooltipText="Can't find what you're looking for? Please reach out to your upline/program manager or create a ticket to request your lead source to be added. For better source KPI we've deprecated the type other."
          options={types}
          value={formData.typeId}
          onChange={handleTypeChange}
          placeholder="Select Type"
          loading={typesLoading}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black font-black text-[9px]">5</span>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Referrals collected*</h3>
        </div>
        <input
          type="number"
          min="0"
          step="1"
          value={formData.referralsCollected}
          onChange={(e) => updateField('referralsCollected', Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
          placeholder="0"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-black font-black text-[9px]">6</span>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Close Type*</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {closeTypes.map((closeType) => (
            <button
              key={closeType}
              onClick={() => updateField('closeType', closeType)}
              className={`py-2 px-3 rounded-lg font-bold transition-all border-2 text-xs ${
                formData.closeType === closeType
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-400'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-400'
              }`}
            >
              {closeType}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
