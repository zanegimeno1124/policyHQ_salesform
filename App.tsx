import React, { useState, useCallback, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Briefcase, 
  User, 
  CheckCircle2,
  Lock,
  Loader2,
  ShieldAlert,
  ClipboardList,
  UserCheck,
  Shield,
  PieChart,
  FileCheck,
  Sun,
  Moon
} from 'lucide-react';
import { ProgressBar } from './components/ProgressBar';
import { QuestionStep } from './components/QuestionStep';
import { NavigationButtons } from './components/NavigationButtons';
import { PreliminaryStep } from './components/PreliminaryStep';
import { ClientInfoStep } from './components/ClientInfoStep';
import { PolicyInfoStep } from './components/PolicyInfoStep';
import { SplitInfoStep } from './components/SplitInfoStep';
import { ConclusionStep } from './components/ConclusionStep';
import { api } from './services/api';
import { SurveyData, Step, UserInfo, ContactInfo } from './types';

// Helper to get local date string YYYY-MM-DD for UI state
const getLocalISODate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalTimestampWithCurrentTime = (dateStr: string) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const now = new Date();
  const target = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return target.getTime(); 
};

// Helper to convert empty strings to null in payload
const convertEmptyStringsToNull = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj === '' ? null : obj;
  if (Array.isArray(obj)) return obj.map(convertEmptyStringsToNull);
  
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      result[key] = value === '' ? null : convertEmptyStringsToNull(value);
    }
  }
  return result;
};

const INITIAL_DATA: SurveyData = {
  statusId: '', statusName: '', pendingFollowUp: '', appointmentHighlights: 'NA',
  splits: [], policyNumber: 'NA', carrierId: '', carrierName: '', product: '',
  initialDraftDate: '', recurringDraftDay: '', faceAmount: '', beneficiary: '',
  monthlyPremium: '', annualPremium: '', 
  transferAmount: '', clientAge: '', lengthOfAnnuity: '',
  policyHolder: '', state: '',
  sourceId: '', sourceName: '', typeId: '', typeName: '',
  isOwnSale: true, submissionAgentNpn: '', submissionAgentId: '', submissionAgentName: '',
  isPolicyCreatedToday: true, policyCreatedDate: getLocalISODate(),
  name: '', currentRole: '', experienceLevel: 'Entry', skills: '', workStyle: 'Hybrid', interests: '',
};

const STEPS: Step[] = [
  { id: 'intro', title: 'Welcome', description: 'Start your sales session.', icon: <Sparkles className="w-6 h-6 text-yellow-500" /> },
  { id: 'preliminary', title: 'Category', description: 'Sale type & dates.', icon: <ClipboardList className="w-4 h-4 text-yellow-500" /> },
  { id: 'clientInfo', title: 'Client', description: 'Policy holder details.', icon: <UserCheck className="w-4 h-4 text-yellow-500" /> },
  { id: 'policyInfo', title: 'Policy', description: 'Product specifics.', icon: <Shield className="w-4 h-4 text-yellow-500" /> },
  { id: 'splitInfo', title: 'Splits', description: 'Agent commissions.', icon: <PieChart className="w-4 h-4 text-yellow-500" /> },
  { id: 'conclusion', title: 'Review', description: 'Final summary.', icon: <FileCheck className="w-4 h-4 text-yellow-500" /> }
];

type AppState = 'initializing' | 'restricted' | 'error' | 'ready' | 'submitted';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('initializing');
  const [initError, setInitError] = useState<string>('');
  const [agent, setAgent] = useState<UserInfo | null>(null);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [locationIdState, setLocationIdState] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<SurveyData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('user_id') || "vopS2odZTP2BLrtfuh3q";
        const locId = params.get('location_id') || "1KuQlZ4tDaBr6ohbhhUf";
        const contactId = params.get('contact_id') || "AUrhtDdJUEaDSjfDlbjl";
        const conversationId = params.get('conversation_id');
        setLocationIdState(locId);

        if (!userId || !locId) {
          setAppState('restricted');
          return;
        }

        const token = await api.login(userId, locId);
        setAuthToken(token);

        const userInfo = await api.getMe(token);
        setAgent(userInfo);

        let contactData: ContactInfo | null = null;
        if (contactId || conversationId) {
          contactData = await api.getContact(token, locId, contactId, conversationId);
          setContact(contactData);
        }

        setFormData(prev => ({
          ...prev, name: userInfo.name, isOwnSale: !!userInfo.agent_id,
          policyHolder: contactData ? `${contactData.firstName} ${contactData.lastName}`.trim() : ''
        }));
        setAppState('ready');
      } catch (err: any) {
        setInitError(err.message || 'Initialization failed.');
        setAppState('error');
      }
    };
    initializeApp();
  }, []);

  const currentStep = STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;

  const handleNext = useCallback(async () => {
    if (currentStep.id === 'preliminary') {
      // Q3: Lead Type (required)
      if (!formData.typeId) return alert("Select lead type.");
      // Q1: If not own sale, agent NPN must be validated
      if (!formData.isOwnSale && !formData.submissionAgentId) return alert("Validate writing agent NPN.");
      // Q2: Policy date must be selected
      if (!formData.policyCreatedDate) return alert("Select policy date.");
    }
    
    if (currentStep.id === 'clientInfo') {
      // All fields are required
      if (!formData.policyHolder) return alert("Enter policy holder name.");
      if (!formData.state) return alert("Select state.");
      if (!formData.sourceId) return alert("Select source.");
    }
    
    if (currentStep.id === 'policyInfo') {
      const isAnnuity = formData.typeName.toLowerCase().includes('annuity');
      
      // Common required fields for all policies
      if (!formData.policyNumber || !formData.carrierId || !formData.product || !formData.initialDraftDate) {
        return alert("Fill required policy fields.");
      }
      
      // Annuity-specific required fields
      if (isAnnuity) {
        if (!formData.transferAmount || !formData.clientAge || !formData.lengthOfAnnuity) {
          return alert("Fill all required annuity fields.");
        }
      } else {
        // Non-annuity required fields
        if (!formData.recurringDraftDay || !formData.monthlyPremium) {
          return alert("Fill recurring draft day and monthly premium.");
        }
      }
    }
    
    if (currentStep.id === 'splitInfo') {
      const totalSplit = formData.splits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
      if (totalSplit > 100) return alert("Total split percentage exceeds 100%.");
      
      // Validate that all splits are properly filled
      for (const split of formData.splits) {
        if (!split.percentage) return alert("All splits must have a percentage.");
        if (split.isOtherSplit) {
          if (!split.otherSplitName || !split.otherSplitReason) {
            return alert("Fill name and reason for all other splits.");
          }
        } else {
          if (!split.isValidated || !split.agentId) {
            return alert("Validate all agent NPNs before proceeding.");
          }
        }
      }
    }
    
    if (currentStep.id === 'conclusion') {
      if (!formData.statusId) return alert("Select status.");
      const shouldShowFollowUp = 
        (formData.sourceName === 'Inbound - CallX' || formData.sourceName === 'Inbound - VIPA Calls') &&
        formData.statusName === 'Follow Up';
      if (shouldShowFollowUp && !formData.pendingFollowUp) return alert("Fill pending follow-up details.");
      if (!formData.appointmentHighlights) return alert("Fill appointment highlights.");
    }

    if (currentStepIndex < STEPS.length - 1) {
       setCurrentStepIndex(prev => prev + 1);
       window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        if (isSubmitting || !authToken) return;
        setIsSubmitting(true);
        const finalAgentId = formData.isOwnSale ? agent?.agent_id : formData.submissionAgentId;
        const isAnnuity = formData.typeName.toLowerCase().includes('annuity');
        
        let payload: any;
        
        if (isAnnuity) {
          // For annuity, group annuity-specific fields
          const { transferAmount, clientAge, lengthOfAnnuity, ...baseData } = formData;
          payload = {
            ...baseData,
            policyCreatedDate: toLocalTimestampWithCurrentTime(formData.policyCreatedDate),
            agent_id: finalAgentId,
            contact_id: contact?.contactId || null,
            location_id: locationIdState,
            phone: contact?.phone || null,
            annuityData: {
              transferAmount,
              clientAge,
              lengthOfAnnuity
            }
          };
        } else {
          // For regular policies, send all data as before
          payload = {
            ...formData,
            policyCreatedDate: toLocalTimestampWithCurrentTime(formData.policyCreatedDate),
            agent_id: finalAgentId,
            contact_id: contact?.contactId || null,
            location_id: locationIdState,
            phone: contact?.phone || null,
          };
        }
        
        // Convert empty strings to null
        payload = convertEmptyStringsToNull(payload);
        
        try {
          if (isAnnuity) {
            await api.createAnnuityPolicy(authToken, payload);
          } else {
            await api.createPolicy(authToken, payload);
          }
          setAppState('submitted');
        } catch (error) {
          alert("Submission failed.");
          setIsSubmitting(false);
        }
    }
  }, [currentStepIndex, formData, currentStep, agent, authToken, contact, locationIdState, isSubmitting]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStepIndex]);

  const handleReset = useCallback(() => {
    setFormData({ ...INITIAL_DATA, policyCreatedDate: getLocalISODate(), name: agent?.name || '', isOwnSale: !!agent?.agent_id, policyHolder: contact ? `${contact.firstName} ${contact.lastName}`.trim() : '' });
    setCurrentStepIndex(0); setAppState('ready'); setIsSubmitting(false);
  }, [agent, contact]);

  if (appState === 'initializing') return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950"><Loader2 className="w-8 h-8 text-yellow-500 animate-spin" /></div>;
  if (appState === 'restricted') return <div className="min-h-screen flex items-center justify-center text-center p-6"><Lock className="w-12 h-12 text-red-500 mx-auto mb-4" /><p>Restricted Access</p></div>;
  if (appState === 'error') return <div className="min-h-screen flex items-center justify-center text-center p-6"><ShieldAlert className="w-12 h-12 text-yellow-600 mx-auto mb-4" /><p>{initError}</p><button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg">Retry</button></div>;

  if (appState === 'submitted') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
      <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
      <h2 className="text-xl font-bold mb-1">Policy Saved!</h2>
      <p className="text-gray-500 text-sm mb-6">Record for {formData.policyHolder} updated.</p>
      <button onClick={handleReset} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg text-sm">New Policy</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300 font-['Poppins']">
      <div className="max-w-[500px] mx-auto flex flex-col min-h-screen relative border-x border-gray-50 dark:border-gray-900">
        {isSubmitting && (
           <div className="fixed inset-0 bg-white/60 dark:bg-gray-950/60 z-[200] flex flex-col items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
              <p className="font-bold">Saving...</p>
           </div>
        )}

        {currentStep.id !== 'intro' && (
          <header className="px-3 py-3 sticky top-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md z-30 border-b border-gray-50 dark:border-gray-900">
            <ProgressBar current={currentStepIndex} total={STEPS.length} />
            <div className="mt-3 flex items-center gap-2">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">{currentStep.icon}</div>
              <div className="flex-1">
                <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{currentStep.title}</h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{currentStep.description}</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
          </header>
        )}

        <main className={`flex-1 px-3 ${currentStep.id === 'intro' ? 'py-6' : 'py-4 pb-24'} relative z-10`}>
          <div className="fade-in">
            {currentStep.id === 'intro' ? (
              <div className="space-y-5 text-center">
                <div className="flex justify-end">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                  </button>
                </div>
                <div className="inline-flex p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">{currentStep.icon}</div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">policyHQ Sales</h2>
                <div className="grid grid-cols-1 gap-3 text-left">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest mb-1.5">Agent</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-600"><User className="w-4 h-4" /></div>
                      <div><h3 className="font-bold text-xs text-gray-900 dark:text-white">{agent?.name || '...'}</h3><p className="text-[10px] text-gray-500">{agent?.agency}</p></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Client</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-600"><Briefcase className="w-4 h-4" /></div>
                      <div><h3 className="font-bold text-xs text-gray-900 dark:text-white">{contact ? `${contact.firstName} ${contact.lastName}` : 'Guest'}</h3><p className="text-[10px] text-gray-500">{contact?.phone || 'No phone'}</p></div>
                    </div>
                  </div>
                </div>
                <button onClick={handleNext} className="w-full py-2.5 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2 shadow-lg text-sm">Start Submission <ChevronRight className="w-4 h-4" /></button>
              </div>
            ) : (
              <QuestionStep title={currentStep.title}>
                {currentStep.id === 'preliminary' && <PreliminaryStep formData={formData} updateField={(f, v) => setFormData(p => ({ ...p, [f]: v }))} authToken={authToken} currentUserHasAgentId={!!agent?.agent_id} />}
                {currentStep.id === 'clientInfo' && <ClientInfoStep formData={formData} updateField={(f, v) => setFormData(p => ({ ...p, [f]: v }))} authToken={authToken} />}
                {currentStep.id === 'policyInfo' && <PolicyInfoStep formData={formData} updateField={(f, v) => setFormData(p => ({ ...p, [f]: v }))} authToken={authToken} />}
                {currentStep.id === 'splitInfo' && <SplitInfoStep formData={formData} updateField={(f, v) => setFormData(p => ({ ...p, [f]: v }))} authToken={authToken} />}
                {currentStep.id === 'conclusion' && <ConclusionStep formData={formData} updateField={(f, v) => setFormData(p => ({ ...p, [f]: v }))} authToken={authToken} />}
              </QuestionStep>
            )}
          </div>
        </main>

        {currentStep.id !== 'intro' && (
          <footer className="px-5 py-5 border-t border-gray-50 dark:border-gray-900 sticky bottom-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm z-20 mt-auto">
            <NavigationButtons onBack={handleBack} onNext={handleNext} disableBack={isFirstStep || isSubmitting} isLastStep={currentStepIndex === STEPS.length - 1} />
          </footer>
        )}
      </div>
    </div>
  );
};

export default App;