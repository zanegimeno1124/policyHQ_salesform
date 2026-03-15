import React, { useEffect, useState } from 'react';
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

  return (
    <div className="space-y-4">
      
      {/* Q1: Policy Number */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Policy Number <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={formData.policyNumber}
          onChange={(e) => updateField('policyNumber', e.target.value)}
          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
          placeholder="Enter Policy Number"
        />
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