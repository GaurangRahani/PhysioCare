import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Activity, AlertTriangle, CheckCircle2, FileText, Frown } from 'lucide-react';

const PatientComplianceTab = ({ patientId }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ flagged: [], normal: [] });

  useEffect(() => {
    fetchLogs();
  }, [patientId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/exercise-logs/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to fetch compliance logs.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error loading compliance logs.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-danger p-6 rounded-2xl border border-red-100 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  const { flagged, normal } = data;

  if (flagged.length === 0 && normal.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-bold text-heading mb-1">No Logs Yet</h3>
        <p className="text-gray-500 text-sm">The patient has not logged any exercise sessions.</p>
      </div>
    );
  }

  const LogCard = ({ log, isFlagged }) => (
    <div className={`p-5 rounded-xl border ${isFlagged ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-100'} flex flex-col md:flex-row gap-4`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-white border border-gray-200 text-dark font-bold px-2.5 py-1 rounded-md text-xs shadow-sm">
            {new Date(log.log_date).toLocaleDateString()}
          </span>
          {log.session_number && (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Session {log.session_number}
            </span>
          )}
          {isFlagged && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-danger bg-red-100 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" /> {log.is_skipped ? 'Skipped' : 'Needs Attention'}
            </span>
          )}
        </div>
        
        {log.is_skipped ? (
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 bg-red-100 text-danger text-xs font-bold rounded">
              Skipped Exercise
            </span>
          </div>
        ) : log.issue_type ? (
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
              Reported Issue: {log.issue_type.replace('_', ' ')}
            </span>
          </div>
        ) : (
          <div className="text-sm font-medium text-dark mb-2">
            Completed <strong className="text-primary">{log.sets_completed}</strong> sets
          </div>
        )}

        {log.comments && (
          <p className="text-sm text-gray-600 italic bg-white p-3 rounded-lg border border-gray-100">
            "{log.comments}"
          </p>
        )}
      </div>

      <div className="md:w-32 flex flex-col justify-center items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pain Level</span>
        <div className={`text-3xl font-black ${
          log.is_skipped ? 'text-gray-300' :
          log.pain_level >= 7 ? 'text-danger' : 
          log.pain_level >= 4 ? 'text-yellow-600' : 
          'text-success'
        }`}>
          {log.is_skipped ? '-' : (log.pain_level ?? '-')}<span className="text-sm font-bold text-gray-300">/10</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {flagged.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <h3 className="font-bold text-danger text-sm uppercase tracking-wide">Flagged Sessions (High Pain or Issues)</h3>
          </div>
          <div className="p-6 space-y-4">
            {flagged.map(log => <LogCard key={log.id} log={log} isFlagged={true} />)}
          </div>
        </div>
      )}

      {normal.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-bold text-heading text-sm uppercase tracking-wide">Normal Sessions</h3>
          </div>
          <div className="p-6 space-y-4">
            {normal.map(log => <LogCard key={log.id} log={log} isFlagged={false} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientComplianceTab;
