import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Activity, AlertTriangle, CheckCircle2, FileText, Frown, ChevronDown, ChevronUp } from 'lucide-react';

const PatientComplianceTab = ({ patientId }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({ summary: [], flagged_entries: [], standalone_concerns: [], grouped_logs: {} });
  const [expandedExercises, setExpandedExercises] = useState({});

  useEffect(() => {
    fetchLogs();
  }, [patientId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/patients/${patientId}/compliance-logs`, {
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

  const toggleAccordion = (exerciseName) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName]
    }));
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

  const { summary, flagged_entries, standalone_concerns, grouped_logs } = data;

  const renderPainBadge = (pain) => {
    if (pain == null) return <span className="text-gray-400">-</span>;
    let colorClass = 'bg-success text-white';
    if (pain >= 7) colorClass = 'bg-danger text-white';
    else if (pain >= 4) colorClass = 'bg-yellow-500 text-white';
    
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colorClass}`}>
        {pain}/10
      </span>
    );
  };

  if (summary.length === 0 && standalone_concerns.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-bold text-heading mb-1">No Logs Yet</h3>
        <p className="text-gray-500 text-sm">The patient has not logged any exercise sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SECTION A: Compliance Summary Cards */}
      {summary.length > 0 && (
        <div>
          <h3 className="font-bold text-heading text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Compliance Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-bold text-dark text-sm mb-3 truncate">{item.exercise_name}</h4>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Sessions</span>
                    <span className="text-lg font-black text-dark">{item.completed_sessions} <span className="text-sm font-medium text-gray-400">/ {item.expected_sessions}</span></span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-gray-400">Avg Sets</span>
                    <span className="text-lg font-black text-dark">{item.avg_sets_completed} <span className="text-sm font-medium text-gray-400">/ {item.prescribed_sets}</span></span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.compliance_percent >= 80 ? 'bg-green-500' : item.compliance_percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, item.compliance_percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION B: Flagged Entries */}
      {flagged_entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <h3 className="font-bold text-danger text-sm uppercase tracking-wide">Flagged Entries (High Pain / Issues)</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {flagged_entries.map(log => (
              <div key={log.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded text-xs">
                      {new Date(log.log_date).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-dark text-sm">{log.exercise_name}</span>
                  </div>
                  {log.issue_type && (
                     <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded mb-1">
                       Issue: {log.issue_type.replace('_', ' ')}
                     </span>
                  )}
                  {log.comments && (
                    <p className="text-sm text-gray-600 italic">"{log.comments}"</p>
                  )}
                </div>
                <div className="shrink-0">
                  {renderPainBadge(log.pain_level)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION C: Reported Concerns */}
      {standalone_concerns.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="bg-orange-50 border-b border-orange-100 px-6 py-4 flex items-center gap-2">
            <Frown className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-orange-800 text-sm uppercase tracking-wide">Reported Concerns</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {standalone_concerns.map(log => (
              <div key={log.id} className="p-4">
                <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded text-xs mb-2 inline-block">
                  {new Date(log.log_date).toLocaleDateString()}
                </span>
                <p className="text-sm text-gray-700 font-medium">{log.comments}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION D: Full Log Drill-down */}
      {Object.keys(grouped_logs).length > 0 && (
        <div>
          <h3 className="font-bold text-heading text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Full Log Drill-down
          </h3>
          <div className="space-y-3">
            {Object.entries(grouped_logs).map(([exerciseName, logs]) => (
              <div key={exerciseName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button 
                  onClick={() => toggleAccordion(exerciseName)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-dark text-sm">{exerciseName} <span className="text-gray-400 font-medium ml-2">({logs.length} logs)</span></span>
                  {expandedExercises[exerciseName] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                
                {expandedExercises[exerciseName] && (
                  <div className="p-0 border-t border-gray-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
                          <th className="py-3 px-4 font-bold">Date</th>
                          <th className="py-3 px-4 font-bold">Sets</th>
                          <th className="py-3 px-4 font-bold">Reps</th>
                          <th className="py-3 px-4 font-bold">Pain</th>
                          <th className="py-3 px-4 font-bold">Comments / Issue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {logs.map(log => (
                          <tr key={log.id} className="text-sm">
                            <td className="py-3 px-4 font-medium text-dark whitespace-nowrap">{new Date(log.log_date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <span className={`font-bold ${log.sets_completed === 0 ? 'text-danger' : 'text-dark'}`}>{log.sets_completed ?? '-'}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{log.reps_completed ?? '-'}</td>
                            <td className="py-3 px-4">{renderPainBadge(log.pain_level)}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1">
                                {log.issue_type && <span className="text-xs font-bold text-yellow-600 uppercase">{log.issue_type.replace('_', ' ')}</span>}
                                {log.comments && <span className="text-gray-600 italic truncate max-w-xs block">{log.comments}</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr>
                            <td colSpan="5" className="py-4 px-4 text-center text-gray-500 text-sm font-medium">No logs recorded for this exercise.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientComplianceTab;
