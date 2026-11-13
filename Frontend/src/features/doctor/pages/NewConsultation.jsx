import React, { useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Loader2, ArrowLeft, Stethoscope, AlertTriangle, Layers, Save, ArrowRight
} from 'lucide-react';

const NewConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();

  const appointment = location.state?.appointment;
  const overviewData = location.state?.overviewData;

  const { user, active_plan, visit_count } = overviewData || {};
  const isFirstVisit = visit_count === 0;

  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [treatmentRecommendations, setTreatmentRecommendations] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!appointment || !overviewData) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl text-center font-['Inter',system-ui,sans-serif]">
        <div className="w-12 h-12 rounded-full bg-[#FFF2CC] text-[#805B00] flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#202223] m-0">Missing Consultation Context</h3>
        <p className="text-[13px] text-[#616161] mt-1.5 mb-5 max-w-sm mx-auto">
          Please initiate the clinical consultation from your doctor dashboard or patients directory.
        </p>
        <Link to="/doctor-dashboard/patients" className="btn-secondary-saas inline-flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Patients
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    if (!diagnosis.trim() || !clinicalNotes.trim()) {
      setError('Diagnosis and Clinical Notes are mandatory to advance.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const payload = {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        treatment_recommendations: treatmentRecommendations.trim(),
        consultation_type: isFirstVisit ? 'initial' : 'follow_up',
        previous_treatment_plan_id: active_plan ? active_plan.id : undefined,
      };

      const res = await fetch(`${apiUrl}/api/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        navigate(`/doctor-dashboard/consultation/${appointmentId}/plan`, {
          state: {
            appointment,
            overviewData,
            consultation: data.consultation
          }
        });
      } else {
        setError(data.message || 'Failed to save clinical consultation record.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while recording the consultation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto font-['Inter',system-ui,sans-serif] text-[#202223] animate-fade-in">
      
      {/* ── Top Navigation Breadcrumb ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#616161] hover:text-[#202223] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-[12px] text-[#8A8A8A]">
          <span className="font-semibold text-[#111111] bg-[#F7F7F7] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md">
            Step 1 of 2
          </span>
          <span>Clinical Assessment</span>
        </div>
      </div>

      {/* ── Consultation Header Card ───────────────────────────────── */}
      <div className="saas-card p-6 bg-[#FFFFFF]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-semibold text-[#202223] tracking-tight m-0">
                  Clinical Consultation
                </h1>
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isFirstVisit ? 'badge-semantic-info' : 'badge-semantic-neutral'
                }`}>
                  {isFirstVisit ? 'Initial Assessment' : 'Follow-up Evaluation'}
                </span>
              </div>
              <p className="text-[13px] text-[#616161] mt-0.5 m-0">
                Patient: <strong className="text-[#202223]">{user?.name}</strong>
                {appointment?.start_time && (
                  <span className="ml-2 font-mono text-[#8A8A8A]">
                    • Scheduled {appointment.start_time.substring(0, 5)}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Plan Context Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[12px] shrink-0">
            <Layers size={13} className="text-[#616161]" />
            <span className="text-[#8A8A8A]">Current Plan:</span>
            <span className="font-medium text-[#202223]">
              {active_plan ? active_plan.title : 'None (New Protocol)'}
            </span>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="mt-4 p-3.5 bg-[#FCE4E4] border border-[#E5484D] text-[#B42318] text-[13px] rounded-xl flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <div className="mt-5 flex flex-col gap-5">
          
          {/* Diagnosis */}
          <div>
            <label className="text-[13px] font-medium text-[#202223] block mb-1.5">
              Clinical Diagnosis <span className="text-[#E5484D]">*</span>
            </label>
            <input 
              type="text" 
              className="w-full px-3.5 py-2.5 text-[14px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all placeholder-[#8A8A8A]"
              placeholder="e.g. Lumbar Disc Herniation, Cervical Spondylosis, Rotator Cuff Strain"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="text-[13px] font-medium text-[#202223] block mb-1.5">
              Clinical Notes & Physical Observations <span className="text-[#E5484D]">*</span>
            </label>
            <textarea 
              rows={4}
              className="w-full px-3.5 py-2.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all placeholder-[#8A8A8A] leading-relaxed"
              placeholder="Record subjective symptoms, Range of Motion (ROM), manual muscle tests, palpation findings, or functional test responses..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
            />
          </div>

          {/* Treatment Recommendations */}
          <div>
            <label className="text-[13px] font-medium text-[#202223] block mb-1.5">
              Therapeutic Recommendations & Lifestyle Ergonomics
            </label>
            <textarea 
              rows={3}
              className="w-full px-3.5 py-2.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all placeholder-[#8A8A8A] leading-relaxed"
              placeholder="Postural corrections, heat/cryotherapy instructions, activity modifications, or general home recovery advice..."
              value={treatmentRecommendations}
              onChange={(e) => setTreatmentRecommendations(e.target.value)}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-[#EAEAEA] flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="btn-secondary-saas"
          >
            Cancel
          </button>

          <button 
            type="button" 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary-saas flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Recording Assessment...' : 'Save & Continue to Treatment Plan'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>

    </div>
  );
};

export default NewConsultation;
