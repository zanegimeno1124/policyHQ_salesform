import React, { useEffect, useState } from 'react';
import { SurveyData, MetaOption } from '../types';
import { api } from '../services/api';
import { SearchableDropdown } from './SearchableDropdown';

interface ConclusionStepProps {
  formData: SurveyData;
  authToken: string | null;
  updateField: (field: keyof SurveyData, value: any) => void;
}

export const ConclusionStep: React.FC<ConclusionStepProps> = ({ formData, authToken, updateField }) => {
  const [statuses, setStatuses] = useState<MetaOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!authToken) return;
      try {
        // Pass type_id if available (especially for annuity)
        const typeId = formData.typeId || undefined;
        const fetchedStatuses = await api.getPolicyStatuses(authToken, typeId);
        setStatuses(fetchedStatuses);
      } catch (error) {
        console.error("Failed to fetch statuses", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, [authToken, formData.typeId]);

  const shouldShowFollowUp = 
    (formData.sourceName === 'Inbound - CallX' || formData.sourceName === 'Inbound - VIPA Calls') &&
    formData.statusName === 'Follow Up';

  // Handle cleanup of pendingFollowUp if it becomes hidden
  useEffect(() => {
    if (!shouldShowFollowUp && formData.pendingFollowUp) {
      updateField('pendingFollowUp', '');
    }
  }, [shouldShowFollowUp, formData.pendingFollowUp, updateField]);

  return (
    <div className="space-y-4">
      
      {/* Q1: Status */}
      <SearchableDropdown
        label="Status *"
        tooltipText="Can't find what you're looking for? Please reach out to your upline/program manager or create a ticket to request your policy status to be added. For better status KPI we've deprecated the status other."
        options={statuses}
        value={formData.statusId}
        onChange={(opt) => {
          updateField('statusId', opt.id);
          updateField('statusName', opt.name);
        }}
        placeholder="Select Status"
        loading={loading}
      />

      {/* Q2: Pending Follow-Up (Conditional) */}
      {shouldShowFollowUp && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Pending Follow-Up <span className="text-red-500">*</span></label>
          <textarea
            value={formData.pendingFollowUp}
            onChange={(e) => updateField('pendingFollowUp', e.target.value)}
            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition h-24 resize-none text-gray-900 dark:text-white text-sm"
            placeholder="Enter follow-up details..."
          />
        </div>
      )}

      {/* Q3: Appointment Highlights */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Appointment Highlights <span className="text-red-500">*</span></label>
        <textarea
          value={formData.appointmentHighlights}
          onChange={(e) => updateField('appointmentHighlights', e.target.value)}
          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition h-24 resize-none text-gray-900 dark:text-white text-sm"
          placeholder="Enter highlights..."
        />
      </div>

    </div>
  );
};