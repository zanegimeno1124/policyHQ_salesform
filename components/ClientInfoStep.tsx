import React, { useEffect, useState } from 'react';
import { SurveyData, MetaOption } from '../types';
import { api } from '../services/api';
import { SearchableDropdown } from './SearchableDropdown';

interface ClientInfoStepProps {
  formData: SurveyData;
  authToken: string | null;
  updateField: (field: keyof SurveyData, value: any) => void;
}

const US_STATES: MetaOption[] = [
  { id: 'Alabama', name: 'Alabama' }, { id: 'Alaska', name: 'Alaska' }, { id: 'Arizona', name: 'Arizona' },
  { id: 'Arkansas', name: 'Arkansas' }, { id: 'California', name: 'California' }, { id: 'Colorado', name: 'Colorado' },
  { id: 'Connecticut', name: 'Connecticut' }, { id: 'Delaware', name: 'Delaware' }, { id: 'Florida', name: 'Florida' },
  { id: 'Georgia', name: 'Georgia' }, { id: 'Hawaii', name: 'Hawaii' }, { id: 'Idaho', name: 'Idaho' },
  { id: 'Illinois', name: 'Illinois' }, { id: 'Indiana', name: 'Indiana' }, { id: 'Iowa', name: 'Iowa' },
  { id: 'Kansas', name: 'Kansas' }, { id: 'Kentucky', name: 'Kentucky' }, { id: 'Louisiana', name: 'Louisiana' },
  { id: 'Maine', name: 'Maine' }, { id: 'Maryland', name: 'Maryland' }, { id: 'Massachusetts', name: 'Massachusetts' },
  { id: 'Michigan', name: 'Michigan' }, { id: 'Minnesota', name: 'Minnesota' }, { id: 'Mississippi', name: 'Mississippi' },
  { id: 'Missouri', name: 'Missouri' }, { id: 'Montana', name: 'Montana' }, { id: 'Nebraska', name: 'Nebraska' },
  { id: 'Nevada', name: 'Nevada' }, { id: 'New Hampshire', name: 'New Hampshire' }, { id: 'New Jersey', name: 'New Jersey' },
  { id: 'New Mexico', name: 'New Mexico' }, { id: 'New York', name: 'New York' }, { id: 'North Carolina', name: 'North Carolina' },
  { id: 'North Dakota', name: 'North Dakota' }, { id: 'Ohio', name: 'Ohio' }, { id: 'Oklahoma', name: 'Oklahoma' },
  { id: 'Oregon', name: 'Oregon' }, { id: 'Pennsylvania', name: 'Pennsylvania' }, { id: 'Rhode Island', name: 'Rhode Island' },
  { id: 'South Carolina', name: 'South Carolina' }, { id: 'South Dakota', name: 'South Dakota' }, { id: 'Tennessee', name: 'Tennessee' },
  { id: 'Texas', name: 'Texas' }, { id: 'Utah', name: 'Utah' }, { id: 'Vermont', name: 'Vermont' },
  { id: 'Virginia', name: 'Virginia' }, { id: 'Washington', name: 'Washington' }, { id: 'West Virginia', name: 'West Virginia' },
  { id: 'Wisconsin', name: 'Wisconsin' }, { id: 'Wyoming', name: 'Wyoming' }, { id: 'District of Columbia', name: 'District of Columbia' }
];

export const ClientInfoStep: React.FC<ClientInfoStepProps> = ({ formData, authToken, updateField }) => {
  const [sources, setSources] = useState<MetaOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!authToken) return;
      try {
        const fetchedSources = await api.getContactSources(authToken);
        setSources(fetchedSources);
      } catch (error) {
        console.error("Failed to fetch meta options", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authToken]);

  return (
    <div className="space-y-4">
      
      {/* Q1: Policy Holder */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">Policy Holder*</label>
        <input
          type="text"
          value={formData.policyHolder}
          onChange={(e) => updateField('policyHolder', e.target.value)}
          className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-gray-900 dark:text-white text-sm"
          placeholder="Client Name"
        />
      </div>

      {/* Q2: State */}
      <SearchableDropdown
        label="State*"
        options={US_STATES}
        value={formData.state}
        onChange={(opt) => updateField('state', opt.id)}
        placeholder="Select State"
      />

      {/* Q3: Source */}
      <SearchableDropdown
        label="Source*"
        tooltipText="Can't find what you're looking for? Please reach out to your upline/program manager or create a ticket to request your lead source to be added. For better source KPI we've deprecated the source other."
        options={sources}
        value={formData.sourceId}
        onChange={(opt) => {
          updateField('sourceId', opt.id);
          updateField('sourceName', opt.name);
        }}
        placeholder="Select Source"
        loading={loading}
      />

    </div>
  );
};