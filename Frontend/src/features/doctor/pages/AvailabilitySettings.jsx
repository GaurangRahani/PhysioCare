import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Clock, CalendarDays, Eye, CheckCircle2 } from 'lucide-react';
import WeeklyRoutineTab from '../components/WeeklyRoutineTab';
import DateOverridesTab from '../components/DateOverridesTab';
import PreviewTab from '../components/PreviewTab';
import './AvailabilitySettings.css';

const AvailabilitySettings = () => {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly', 'overrides', 'preview'
  const [availabilityRules, setAvailabilityRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getToken } = useAuth();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/availability`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAvailabilityRules(data.availability_rules);
      } else {
        setError(data.message || 'Failed to fetch rules');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching availability rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleRulesUpdated = (newRules) => {
    setAvailabilityRules(newRules);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#202223]" />
        <span className="text-xs text-[#8A8A8A]">Loading availability blueprint...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FCE4E4] text-[#B42318] p-4 rounded-xl text-xs border border-[#E5E5E5] max-w-xl mx-auto my-8">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full font-['Inter',system-ui,sans-serif] text-[#202223]">
      
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAEAEA]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold text-[#202223] tracking-tight m-0">
              Doctor Availability & Scheduling
            </h1>
            <span className="badge-semantic-success">
              <CheckCircle2 size={11} /> Live Engine
            </span>
          </div>
          <p className="text-[13px] text-[#616161] mt-1 font-normal">
            Configure weekly recurring consultation shifts, slot durations, date overrides, and inspect live slots.
          </p>
        </div>

        {/* Quick Current Blueprint Pill */}
        <div className="flex items-center gap-2 bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-1.5 rounded-lg text-[12px] text-[#616161] shrink-0">
          <span className="text-[#8A8A8A]">Slot Duration:</span>
          <span className="font-semibold text-[#202223] font-mono">
            {availabilityRules?.slot_minutes || 30} mins
          </span>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'weekly' 
              ? 'bg-[#FFFFFF] text-[#202223] shadow-[0_1px_3px_rgba(0,0,0,0.06)]' 
              : 'text-[#616161] hover:text-[#202223]'
          }`}
        >
          <Clock size={14} className={activeTab === 'weekly' ? 'text-[#202223]' : 'text-[#8A8A8A]'} />
          <span>Weekly Routine</span>
        </button>

        <button
          onClick={() => setActiveTab('overrides')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'overrides' 
              ? 'bg-[#FFFFFF] text-[#202223] shadow-[0_1px_3px_rgba(0,0,0,0.06)]' 
              : 'text-[#616161] hover:text-[#202223]'
          }`}
        >
          <CalendarDays size={14} className={activeTab === 'overrides' ? 'text-[#202223]' : 'text-[#8A8A8A]'} />
          <span>Date Overrides</span>
          {Object.keys(availabilityRules?.specific_dates || {}).length > 0 && (
            <span className="text-[10px] bg-[#EEEEEE] text-[#555555] px-1.5 py-0.2 rounded-full font-semibold">
              {Object.keys(availabilityRules.specific_dates).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'preview' 
              ? 'bg-[#FFFFFF] text-[#202223] shadow-[0_1px_3px_rgba(0,0,0,0.06)]' 
              : 'text-[#616161] hover:text-[#202223]'
          }`}
        >
          <Eye size={14} className={activeTab === 'preview' ? 'text-[#202223]' : 'text-[#8A8A8A]'} />
          <span>Live Slots Preview</span>
        </button>
      </div>

      {/* ── Tab Content Container ───────────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {activeTab === 'weekly' && (
          <WeeklyRoutineTab
            rules={availabilityRules}
            onUpdate={handleRulesUpdated}
            getToken={getToken}
          />
        )}

        {activeTab === 'overrides' && (
          <DateOverridesTab
            rules={availabilityRules}
            onUpdate={handleRulesUpdated}
            getToken={getToken}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewTab
            getToken={getToken}
          />
        )}
      </div>

    </div>
  );
};

export default AvailabilitySettings;