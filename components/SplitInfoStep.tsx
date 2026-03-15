import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2, User, Users } from 'lucide-react';
import { SurveyData, Split } from '../types';
import { api } from '../services/api';

interface SplitInfoStepProps {
  formData: SurveyData;
  authToken: string | null;
  updateField: (field: keyof SurveyData, value: any) => void;
}

export const SplitInfoStep: React.FC<SplitInfoStepProps> = ({ formData, authToken, updateField }) => {
  const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set());
  
  // Check if the selected type is annuity
  const isAnnuity = formData.typeName.toLowerCase().includes('annuity');

  // Calculate remaining commission
  const totalSplitPercentage = formData.splits.reduce((sum, split) => sum + (parseFloat(split.percentage) || 0), 0);
  const myCommission = Math.max(0, 100 - totalSplitPercentage);

  const addSplit = (isOtherSplit: boolean = false) => {
    if (totalSplitPercentage >= 100) return;
    
    const newSplit: Split = {
      id: crypto.randomUUID(),
      npn: '',
      agentId: '',
      agentName: '',
      percentage: '',
      isValidated: isOtherSplit, // Other splits don't need NPN validation
      isOtherSplit: isOtherSplit,
      otherSplitName: '',
      otherSplitReason: ''
    };

    updateField('splits', [...formData.splits, newSplit]);
  };

  const removeSplit = (id: string) => {
    updateField('splits', formData.splits.filter(s => s.id !== id));
  };

  const updateSplit = (id: string, field: keyof Split, value: any) => {
    const newSplits = formData.splits.map(s => {
      if (s.id === id) {
        // If changing NPN, invalidate previous validation
        if (field === 'npn' && value !== s.npn) {
          return { ...s, [field]: value, isValidated: false, agentId: '', agentName: '', validationError: undefined, percentage: '' };
        }
        return { ...s, [field]: value };
      }
      return s;
    });
    updateField('splits', newSplits);
  };

  const validateNpn = async (split: Split) => {
    if (!authToken || !split.npn) return;

    setValidatingIds(prev => new Set(prev).add(split.id));
    
    // Clear previous errors
    const splitsAfterClear = formData.splits.map(s => s.id === split.id ? { ...s, validationError: undefined } : s);
    updateField('splits', splitsAfterClear);

    try {
      const result = await api.validateAgent(authToken, split.npn);
      
      const newSplits = formData.splits.map(s => {
        if (s.id === split.id) {
          return {
            ...s,
            agentId: result.agent_id,
            agentName: result.agent_name,
            isValidated: true,
            validationError: undefined
          };
        }
        return s;
      });
      updateField('splits', newSplits);

    } catch (error) {
      const newSplits = formData.splits.map(s => {
        if (s.id === split.id) {
          return {
            ...s,
            isValidated: false,
            agentId: '',
            agentName: '',
            validationError: 'Invalid NPN'
          };
        }
        return s;
      });
      updateField('splits', newSplits);
    } finally {
      setValidatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(split.id);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Commission Summary */}
      <div className={`p-4 rounded-xl border-2 transition-colors flex items-center justify-between shadow-sm
        ${myCommission < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900'}`}>
        <div>
          <h3 className="text-gray-900 dark:text-white font-bold text-base">Your Commission</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Based on {formData.splits.length} split(s)</p>
        </div>
        <div className={`text-2xl font-bold ${myCommission < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {myCommission.toFixed(0)}%
        </div>
      </div>

      {/* Split List */}
      <div className="space-y-3">
        {formData.splits.map((split, index) => (
          <div key={split.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="absolute -left-2 top-4 bg-gray-900 dark:bg-gray-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {index + 1}
            </div>
            
            {/* Regular Agent Split */}
            {!split.isOtherSplit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Q1: NPN */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Agent NPN <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={split.npn}
                      onChange={(e) => updateSplit(split.id, 'npn', e.target.value)}
                      className={`w-full p-2 bg-gray-50 dark:bg-gray-700 border rounded-lg outline-none transition focus:ring-2 text-gray-900 dark:text-white text-sm
                        ${split.validationError 
                          ? 'border-red-300 dark:border-red-500/50 focus:ring-red-200' 
                          : split.isValidated 
                            ? 'border-green-300 dark:border-green-500/50 bg-green-50 dark:bg-green-900/20' 
                            : 'border-gray-200 dark:border-gray-600 focus:ring-yellow-400 focus:border-yellow-400 dark:focus:border-yellow-400'}`}
                      placeholder="Enter NPN"
                    />
                    <button
                      onClick={() => validateNpn(split)}
                      disabled={validatingIds.has(split.id) || !split.npn || split.isValidated}
                      className={`px-2.5 rounded-lg font-semibold transition-all flex items-center justify-center min-w-[2.5rem]
                        ${split.isValidated 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
                          : !split.npn 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-[0_0_15px_rgba(250,204,21,0.5)] ring-2 ring-yellow-400 ring-offset-2'}`}
                    >
                       {validatingIds.has(split.id) ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                       ) : split.isValidated ? (
                         <CheckCircle2 className="w-4 h-4" />
                       ) : (
                         <User className="w-4 h-4" />
                       )}
                    </button>
                  </div>
                  {split.validationError && (
                    <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> {split.validationError}
                    </p>
                  )}
                  {split.isValidated && (
                     <p className="text-green-600 dark:text-green-400 text-[10px] mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> {split.agentName}
                    </p>
                  )}
                </div>

                {/* Q2: Percentage */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Split Percentage <span className="text-red-500">*</span></label>
                  <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={split.percentage}
                        onChange={(e) => updateSplit(split.id, 'percentage', e.target.value)}
                        disabled={!split.isValidated}
                        className={`w-full p-2 pr-8 border rounded-lg outline-none transition text-gray-900 dark:text-white text-sm
                          ${!split.isValidated 
                              ? 'bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400'}`}
                        placeholder={!split.isValidated ? "Validate NPN first" : "0"}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sm ${!split.isValidated ? 'text-gray-300 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Other Split (for Annuity) */}
            {split.isOtherSplit && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={split.otherSplitName || ''}
                      onChange={(e) => updateSplit(split.id, 'otherSplitName', e.target.value)}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
                      placeholder="Who are you trying to split with?"
                    />
                  </div>

                  {/* Percentage */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Split Percentage <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={split.percentage}
                          onChange={(e) => updateSplit(split.id, 'percentage', e.target.value)}
                          className="w-full p-2 pr-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 dark:text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Reason <span className="text-red-500">*</span></label>
                  <textarea
                    value={split.otherSplitReason || ''}
                    onChange={(e) => updateSplit(split.id, 'otherSplitReason', e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white resize-none text-sm"
                    placeholder="Enter reason for split..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            <button 
              onClick={() => removeSplit(split.id)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {formData.splits.length === 0 && (
           <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
              <Users className="w-8 h-8 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-xs">No splits added. You will receive 100% commission.</p>
           </div>
        )}
      </div>

      {/* Add Button(s) */}
      {!isAnnuity ? (
        <button
          onClick={() => addSplit(false)}
          disabled={totalSplitPercentage >= 100}
          className={`w-full py-2.5 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 font-semibold transition-all text-sm
            ${totalSplitPercentage >= 100 
              ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed' 
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-yellow-400 dark:hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'}`}
        >
          <Plus className="w-4 h-4" /> Add Split Agent
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={() => addSplit(false)}
            disabled={totalSplitPercentage >= 100}
            className={`py-2.5 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 font-semibold transition-all text-sm
              ${totalSplitPercentage >= 100 
                ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-yellow-400 dark:hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'}`}
          >
            <User className="w-4 h-4" /> Add Agent Split
          </button>
          <button
            onClick={() => addSplit(true)}
            disabled={totalSplitPercentage >= 100}
            className={`py-2.5 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 font-semibold transition-all text-sm
              ${totalSplitPercentage >= 100 
                ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-yellow-400 dark:hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'}`}
          >
            <Users className="w-4 h-4" /> Add Other Split
          </button>
        </div>
      )}

      {totalSplitPercentage > 100 && (
         <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Total split percentage exceeds 100%. Please adjust values.</span>
         </div>
      )}
    </div>
  );
};