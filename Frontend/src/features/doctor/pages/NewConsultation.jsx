import React, { useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import './ConsultationFlow.css';

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
      <div className="consultation-flow-theme" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="alert-warning" style={{ justifyContent: 'center', marginBottom: '1rem', display: 'inline-flex' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Missing patient context. Please start from the dashboard.
          </div>
          <br/>
          <Link to="/doctor-dashboard" className="btn-outline">
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </Link>
        </div>
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
        // Navigate to Treatment Plan Builder
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
    <div className="consultation-flow-theme">
      
      {/* FIXED THEME BACKGROUND */}
      <div className="theme-bg" style={{ backgroundImage: 'url(/images/banner/img1.jpg)' }}>
        <img className="pt-img1" style={{ animation: 'left-right 8s infinite ease-in-out' }} src="/images/shap/wave-blue.png" alt=""/>
        <img className="pt-img2" style={{ animation: 'up-down 6s infinite ease-in-out' }} src="/images/shap/circle-dots.png" alt=""/>
        <img className="pt-img3" style={{ animation: 'rotation 20s infinite linear' }} src="/images/shap/plus-blue.png" alt=""/>
        <div className="bg-shape-bottom"></div>
      </div>

      <div className="flow-container">
        <button className="back-nav" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>

        <div className="step-container">
          
          {error && (
            <div className="alert-warning" style={{ backgroundColor: 'rgba(247, 43, 80, 0.08)', borderColor: 'rgba(247, 43, 80, 0.2)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--danger)' }}></i> {error}
            </div>
          )}

          {/* Header Card */}
          <div className="card card-accent-top">
              <h2 className="header-title"><i className="fa-solid fa-stethoscope"></i> New Consultation</h2>
              <div className="header-meta">{user?.name || 'Unknown Patient'} &bull; {appointment?.start_time?.substring(0,5)}</div>
          </div>

          {/* Info Card */}
          <div className="card">
              <div className="info-grid">
                  <div className="info-block">
                      <div className="info-label">Visit Type</div>
                      <div className="info-value">{isFirstVisit ? 'Initial Visit' : 'Follow-up Visit'}</div>
                  </div>
                  <div className="info-block" style={{ borderColor: active_plan ? 'rgba(86, 90, 207, 0.3)' : 'var(--gray-200)' }}>
                      <div className="info-label">Reviewing Plan</div>
                      <div className="info-value" style={{ color: active_plan ? 'var(--primary)' : 'var(--dark-brand)' }}>
                        {active_plan ? active_plan.title : 'None (New Patient)'}
                      </div>
                  </div>
              </div>
          </div>

          {/* Form Card */}
          <div className="card">
              <div className="form-group">
                  <label className="form-label">Diagnosis <span className="req">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Cervical Spondylosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
              </div>
              
              <div className="form-group">
                  <label className="form-label">Clinical Notes <span className="req">*</span></label>
                  <textarea 
                    className="form-control" 
                    placeholder="Record patient reports, ROM observations, etc."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  ></textarea>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Treatment Recommendations</label>
                  <textarea 
                    className="form-control" 
                    placeholder="General recommendations for the patient..."
                    value={treatmentRecommendations}
                    onChange={(e) => setTreatmentRecommendations(e.target.value)}
                  ></textarea>
              </div>
          </div>

          <div className="flex-end">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="fa-spin" style={{ width: '1.2rem', height: '1.2rem' }} /> : <i className="fa-regular fa-floppy-disk"></i>} 
                  {saving ? 'Saving...' : 'Save Consultation & Continue to Plan'}
              </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewConsultation;
