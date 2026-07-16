import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  ArrowLeft, FileText, History, Stethoscope, Loader2, Calendar, 
  User, Phone, MapPin, Activity, AlertTriangle, ChevronRight, CheckCircle2
} from 'lucide-react';
import PatientComplianceTab from '../components/PatientComplianceTab';

const StartConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  
  // We can pass appointment data via state to avoid refetching it if we came from dashboard
  const [appointment, setAppointment] = useState(location.state?.appointment || null);
  
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'
  
  const [overviewData, setOverviewData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If appointment isn't in state (e.g. direct link), we'd ideally fetch it.
    // For now we assume we always have it or we can't load the patient properly 
    // unless we have an endpoint to fetch a single appointment.
    // Assuming we have appointment.patient_id
    if (appointment?.patient_id) {
      fetchPatientData(appointment.patient_id);
    } else {
      setError("No appointment data found. Please go back to the dashboard.");
      setLoading(false);
    }
  }, [appointment, getToken]);

  const fetchPatientData = async (patientId) => {
    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // 1. Fetch Overview
      const overviewRes = await fetch(`${apiUrl}/api/patients/${patientId}/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const overviewJson = await overviewRes.json();

      // 2. Fetch History
      const historyRes = await fetch(`${apiUrl}/api/patients/${patientId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyJson = await historyRes.json();

      if (overviewJson.success && historyJson.success) {
        setOverviewData(overviewJson.data);
        setHistoryData(historyJson.data);
      } else {
        setError('Failed to load patient data.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-danger p-4 rounded-xl border border-red-100 mb-4">{error}</div>
        <button onClick={() => navigate('/doctor-dashboard')} className="text-primary font-semibold hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const { user, profile, active_plan, visit_count } = overviewData || {};
  const isFirstVisit = visit_count === 0;

  // Calculate age if DOB exists
  const getAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const age = getAge(profile?.date_of_birth);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/doctor-dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-dark font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Patient Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold text-heading">{user?.name || 'Unknown Patient'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isFirstVisit ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                {isFirstVisit ? 'First Visit' : 'Follow-up'}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                {profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'} {age ? `• ${age} yrs` : ''}
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-400" />
                {user?.phone || 'No phone'}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Appt: {appointment?.start_time ? appointment.start_time.substring(0,5) : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
           {appointment?.status === 'completed' ? (
             <div className="bg-gray-50 text-gray-500 font-bold px-6 py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2">
               <CheckCircle2 className="w-5 h-5" /> Consultation Complete
             </div>
           ) : (
             <button 
                onClick={() => navigate(`/doctor-dashboard/consultation/${appointmentId}/new`, { state: { appointment, overviewData } })}
                className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-dark transition-all shadow-[0_4px_14px_rgba(86,90,207,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-5 h-5" />
                Start Consultation
              </button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark hover:border-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark hover:border-gray-300'
          }`}
        >
          <History className="w-4 h-4" /> Clinical History
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'compliance' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark hover:border-gray-300'
          }`}
        >
          <Activity className="w-4 h-4" /> Compliance & Logs
        </button>
      </div>

      {/* Tab Content */}
      <div className="pb-10">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Medical Profile */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Medical Profile
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-1">Medical History / Notes</span>
                    <p className="text-sm font-medium text-dark leading-relaxed">
                      {profile?.medical_history || 'No medical history recorded.'}
                    </p>
                  </div>
                  
                  {profile?.emergency_contact_name && (
                    <div className="pt-4 border-t border-gray-100">
                      <span className="block text-xs font-semibold text-gray-400 mb-1">Emergency Contact</span>
                      <p className="text-sm font-medium text-dark flex items-center gap-2">
                         {profile.emergency_contact_name}
                         <span className="text-gray-400">•</span> 
                         {profile.emergency_contact_phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Active Treatment Plan */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Current Treatment Plan
                  </h3>
                </div>

                {active_plan ? (
                  <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                     <h4 className="font-extrabold text-lg text-dark mb-1">{active_plan.title || 'Untitled Plan'}</h4>
                     <p className="text-sm text-gray-500 font-medium mb-4">
                       Started on {new Date(active_plan.start_date).toLocaleDateString()}
                     </p>
                     
                     <div className="flex items-center gap-2">
                       <button onClick={() => alert('View plan details not implemented yet')} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                         View Full Plan <ChevronRight className="w-4 h-4" />
                       </button>
                     </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <Activity className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No active treatment plan.</p>
                    <p className="text-xs text-gray-400 mt-1">You can create one during the consultation.</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-heading text-sm uppercase tracking-wide">Past Consultations</h3>
              </div>
              
              <div className="p-0">
                {!historyData?.consultations?.length ? (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No past consultations found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {historyData.consultations.map((consult, idx) => (
                      <div key={consult.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-3">
                              <span className="bg-gray-100 text-gray-600 font-bold px-2.5 py-1 rounded-md text-xs">
                                {new Date(consult.consultation_date).toLocaleDateString()}
                              </span>
                              <span className="font-bold text-dark">{consult.diagnosis || 'No Diagnosis'}</span>
                           </div>
                           <span className="text-xs font-semibold text-gray-400 uppercase">
                             {consult.consultation_type === 'initial' ? 'Initial Visit' : 'Follow-up'}
                           </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {consult.clinical_notes || 'No notes provided.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && appointment?.patient_id && (
          <PatientComplianceTab patientId={appointment.patient_id} />
        )}

      </div>
    </div>
  );
};

export default StartConsultation;
