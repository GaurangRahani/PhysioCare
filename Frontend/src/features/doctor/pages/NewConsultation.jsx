import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ArrowLeft, Stethoscope, Loader2, Save } from 'lucide-react';

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
      <div className="p-8">
        <div className="bg-red-50 text-danger p-4 rounded-xl border border-red-100 mb-4">
          Missing patient context. Please start from the dashboard.
        </div>
        <button onClick={() => navigate('/doctor-dashboard')} className="text-primary font-semibold hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!diagnosis.trim() || !clinicalNotes.trim()) {
      setError('Diagnosis and Clinical Notes are required.');
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
        // Navigate to Treatment Plan Builder (Screen 17)
        navigate(`/doctor-dashboard/consultation/${appointmentId}/plan`, {
          state: {
            appointment,
            overviewData,
            consultation: data.consultation
          }
        });
      } else {
        setError(data.message || 'Failed to save consultation.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-dark font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        
        <div className="flex items-center gap-3 mb-1">
          <Stethoscope className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-heading">New Consultation</h1>
        </div>
        <p className="text-gray-500 font-medium">
          {user?.name} &bull; {appointment?.start_time?.substring(0,5)}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-danger p-4 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Form Context Info */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-6">
        <div>
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Visit Type</span>
          <span className="font-bold text-dark">{isFirstVisit ? 'Initial Visit' : 'Follow-up Visit'}</span>
        </div>
        <div className="hidden sm:block w-px h-10 bg-gray-200"></div>
        <div>
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reviewing Plan</span>
          <span className="font-bold text-dark">{active_plan ? active_plan.title : 'None (New Patient)'}</span>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-heading mb-2">
            Diagnosis <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            placeholder="e.g. Cervical Spondylosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-heading mb-2">
            Clinical Notes <span className="text-danger">*</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium min-h-[120px]"
            placeholder="Record patient reports, ROM observations, etc."
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-bold text-heading mb-2">
            Treatment Recommendations
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium min-h-[100px]"
            placeholder="General recommendations for the patient..."
            value={treatmentRecommendations}
            onChange={(e) => setTreatmentRecommendations(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:bg-dark transition-all shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Consultation & Continue to Plan
        </button>
      </div>

    </div>
  );
};

export default NewConsultation;
