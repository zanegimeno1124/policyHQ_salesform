import React, { useEffect, useRef, useState } from 'react';
import { SurveyData, MetaOption } from '../types';
import { api } from '../services/api';
import { SearchableDropdown } from './SearchableDropdown';
import { DatePicker } from './DatePicker';

interface PolicyInfoStepProps {
  formData: SurveyData;
  authToken: string | null;
  updateField: (field: keyof SurveyData, value: any) => void;
}

export const PolicyInfoStep: React.FC<PolicyInfoStepProps> = ({ formData, authToken, updateField }) => {
  const [carriers, setCarriers] = useState<MetaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [policyNumValidating, setPolicyNumValidating] = useState(false);
  const validationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if the selected type is annuity
  const isAnnuity = formData.typeName.toLowerCase().includes('annuity');

  // Generate length of annuity options (1-20 years)
  const lengthOfAnnuityOptions: MetaOption[] = Array.from({ length: 20 }, (_, i) => ({
    id: (i + 1).toString(),
    name: `${i + 1} ${i + 1 === 1 ? 'Year' : 'Years'}`
  }));

  useEffect(() => {
    const fetchCarriers = async () => {
      if (!authToken) return;
      try {
        const fetchedCarriers = await api.getCarriers(authToken);
        setCarriers(fetchedCarriers);
      } catch (error) {
        console.error("Failed to fetch carriers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarriers();
  }, [authToken]);

  // Auto-calculate Annual Premium
  useEffect(() => {
    const monthly = parseFloat(formData.monthlyPremium);
    if (!isNaN(monthly)) {
      const annual = (monthly * 12).toFixed(2);
      if (annual !== formData.annualPremium) {
        updateField('annualPremium', annual);
      }
    } else if (formData.annualPremium !== '') {
        updateField('annualPremium', '');
    }
  }, [formData.monthlyPremium, formData.annualPremium, updateField]);

  const handleRecurringDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!e.target.value) {
        updateField('recurringDraftDay', '');
    } else if (val >= 1 && val <= 31) {
        updateField('recurringDraftDay', e.target.value);
    }
  };

  const handlePolicyNumberBlur = async () => {
    const value = formData.policyNumber.trim();
    if (!value) return;
    if (validationDebounceRef.current) clearTimeout(validationDebounceRef.current);
    setPolicyNumValidating(true);
    updateField('policyNumberValid', null);
    try {
      const isDuplicate = await api.validatePolicyNumber(authToken!, value);
      // isDuplicate true = already exists (reject), false = available (accept)
      updateField('policyNumberValid', !isDuplicate);
    } catch {
      // On network error, allow proceeding
      updateField('policyNumberValid', true);
    } finally {
      setPolicyNumValidating(false);
    }
  };

  const handlePolicyNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('policyNumber', e.target.value);
    updateField('policyNumberValid', null);
  };

  return (
    <div className="space-y-4">
      
      {/* Q1: Policy Number */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200">
            Policy Number {formData.policyNumberAvailable && <span className="text-red-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => {
              const next = !formData.policyNumberAvailable;
              updateField('policyNumberAvailable', next);
              if (!next) {
                updateField('policyNumber', '');
                updateField('policyNumberValid', null);
              }
            }}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 ${
              formData.policyNumberAvailable ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={formData.policyNumberAvailable}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                formData.policyNumberAvailable ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {formData.policyNumberAvailable && (
          <div className="relative">
            <input
              type="text"
              value={formData.policyNumber}
              onChange={handlePolicyNumberChange}
              onBlur={handlePolicyNumberBlur}
              className={`w-full p-2.5 pr-9 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm ${
                formData.policyNumberValid === false
                  ? 'border-red-400 dark:border-red-500'
                  : formData.policyNumberValid === true
                  ? 'border-green-400 dark:border-green-500'
                  : 'border-gray-200 dark:border-gray-600'
              }`}
              placeholder="Enter Policy Number"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {policyNumValidating && (
                <svg className="animate-spin h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {!policyNumValidating && formData.policyNumberValid === true && (
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!policyNumValidating && formData.policyNumberValid === false && (
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
        )}
        {formData.policyNumberAvailable && formData.policyNumberValid === false && (
          <p className="text-xs text-red-500 mt-1">This policy number already exists. Please use a different one.</p>
        )}
        {formData.policyNumberAvailable && formData.policyNumberValid === true && (
          <p className="text-xs text-green-500 mt-1">Policy number is available.</p>
        )}
        {!formData.policyNumberAvailable && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Toggle on when the policy number is available.</p>
        )}
      </div>

      {/* Q2: Carrier */}
      <SearchableDropdown
        label="Carrier *"
        tooltipText="Can't find what you're looking for? Please reach out to your upline/program manager or create a ticket to request your policy carrier to be added. For better carrier KPI we've deprecated the carrier other."
        options={carriers}
        value={formData.carrierId}
        onChange={(opt) => {
          updateField('carrierId', opt.id);
          updateField('carrierName', opt.name);
        }}
        placeholder="Select Carrier"
        loading={loading}
      />

      {/* Q3: Product */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Product <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={formData.product}
          onChange={(e) => updateField('product', e.target.value)}
          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
          placeholder="Product Name"
        />
      </div>

      {/* Q4: Initial Draft Date */}
      <div>
         <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-2">Initial Draft Date <span className="text-red-500">*</span></label>
         <DatePicker 
            selectedDate={formData.initialDraftDate} 
            onChange={(date) => updateField('initialDraftDate', date)}
        />
      </div>

      {/* Q5: Recurring Draft Day - Hidden for Annuity */}
      {!isAnnuity && (
        <div>
          <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Recurring Draft Day (1-31) <span className="text-red-500">*</span></label>
          <input
            type="number"
            min="1"
            max="31"
            value={formData.recurringDraftDay}
            onChange={handleRecurringDayChange}
            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
            placeholder="DD"
          />
        </div>
      )}

      {/* Face Amount and Beneficiary - Face Amount hidden for Annuity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Q6: Face Amount - Hidden for Annuity */}
          {!isAnnuity && (
            <div>
              <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Face Amount (Optional)</label>
              <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-sm">$</span>
                  <input
                  type="number"
                  value={formData.faceAmount}
                  onChange={(e) => updateField('faceAmount', e.target.value)}
                  className="w-full p-2.5 pl-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
                  placeholder="0.00"
                  />
              </div>
            </div>
          )}

          {/* Q7: Beneficiary */}
          <div className={!isAnnuity ? '' : 'md:col-span-2'}>
            <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Beneficiary (Optional)</label>
            <input
                type="text"
                value={formData.beneficiary}
                onChange={(e) => updateField('beneficiary', e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
                placeholder="Beneficiary Name"
            />
          </div>
      </div>

      {/* Monthly Premium and Annual Premium - Hidden for Annuity */}
      {!isAnnuity && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Q8: Monthly Premium */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Monthly Premium <span className="text-red-500">*</span></label>
              <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-sm">$</span>
                  <input
                  type="number"
                  step="0.01"
                  value={formData.monthlyPremium}
                  onChange={(e) => updateField('monthlyPremium', e.target.value)}
                  className="w-full p-2.5 pl-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
                  placeholder="0.00"
                  />
              </div>
            </div>

             {/* Q9: Annual Premium */}
             <div>
              <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Annual Premium (Calculated)</label>
               <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-sm">$</span>
                  <input
                      type="text"
                      readOnly
                      value={formData.annualPremium}
                      className="w-full p-2.5 pl-8 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-gray-500 dark:text-gray-300 cursor-not-allowed text-sm"
                      placeholder="0.00"
                  />
               </div>
            </div>
        </div>
      )}

      {/* Annuity-specific fields - Only shown for Annuity */}
      {isAnnuity && (
        <>
          {/* Transfer Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Transfer Amount <span className="text-red-500">*</span></label>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">How much is the amount of money the client will be transferring?</p>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-sm">$</span>
                <input
                type="number"
                step="0.01"
                value={formData.transferAmount}
                onChange={(e) => updateField('transferAmount', e.target.value)}
                className="w-full p-2.5 pl-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
                placeholder="0.00"
                />
            </div>
          </div>

          {/* Client Age */}
          <div>
            <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Client Age <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              max="120"
              value={formData.clientAge}
              onChange={(e) => updateField('clientAge', e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
              placeholder="Age"
            />
          </div>

          {/* Length of Annuity */}
          <SearchableDropdown
            label="Length of Annuity *"
            options={lengthOfAnnuityOptions}
            value={formData.lengthOfAnnuity}
            onChange={(opt) => updateField('lengthOfAnnuity', opt.id)}
            placeholder="Select Length (Years)"
          />
        </>
      )}
    </div>
  );
};