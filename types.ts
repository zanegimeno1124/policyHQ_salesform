import React from 'react';

export interface Split {
  id: string; // Unique identifier for UI list management
  npn: string;
  agentId: string; // From API validation
  agentName: string; // From API validation
  percentage: string;
  isValidated: boolean; // Helper to track validation status
  validationError?: string;
  // For annuity "other split"
  isOtherSplit?: boolean; // True if this is an "other split" for annuity
  otherSplitName?: string; // Name of the person/entity for other split
  otherSplitReason?: string; // Reason for the other split
}

export interface SurveyData {
  // Step 6: Conclusion
  statusId: string;
  statusName: string;
  pendingFollowUp: string;
  appointmentHighlights: string;

  // Step 5: Split Information
  splits: Split[];

  // Step 4: Policy Information
  policyNumberAvailable: boolean;
  policyNumber: string;
  policyNumberValid: boolean | null; // null = not validated, true = valid, false = duplicate
  carrierId: string;
  carrierName: string;
  product: string;
  initialDraftDate: string;
  recurringDraftDay: string; // Storing as string to handle empty state easily in inputs
  faceAmount: string; // Optional
  beneficiary: string; // Optional
  monthlyPremium: string;
  annualPremium: string; // Calculated
  
  // Annuity-specific fields (only used when type is annuity)
  transferAmount: string; // Required for annuity
  clientAge: string; // Required for annuity
  lengthOfAnnuity: string; // Required for annuity (1-20)

  // Step 3: Client Information
  policyHolder: string;
  state: string;
  sourceId: string;
  sourceName: string;
  typeId: string;
  typeName: string;

  // Step 2: Preliminary
  isOwnSale: boolean;
  submissionAgentNpn: string;
  submissionAgentId: string;
  submissionAgentName: string;
  isPolicyCreatedToday: boolean;
  policyCreatedDate: string; // ISO Date string

  // Existing fields
  name: string;
  currentRole: string;
  experienceLevel: string;
  skills: string;
  workStyle: string;
  interests: string;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// API Types
export interface AuthResponse {
  authToken: string;
}

export interface UserInfo {
  id: string;
  npn: number | null;
  name: string;
  agency: string;
  agent_id: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  contactId: string;
  phone: string;
}

export interface ValidatedAgent {
  agent_id: string;
  npn: number;
  agent_name: string;
}

export interface MetaOption {
  id: string;
  name: string; // Assuming 'name' or 'label' based on common patterns, will adapt if different
}

export interface AppContext {
  user: UserInfo | null;
  contact: ContactInfo | null;
  authToken: string | null;
}