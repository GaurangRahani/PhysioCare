import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/availability`, {
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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-danger p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="availability-theme">
      {/* FIXED THEME BACKGROUND */}
      <div className="theme-bg" style={{ backgroundImage: 'url(/images/banner/img1.jpg)' }}>
        <img className="pt-img1" style={{ animation: 'left-right 8s infinite ease-in-out' }} src="/images/shap/wave-blue.png" alt="" />
        <img className="pt-img2" style={{ animation: 'up-down 6s infinite ease-in-out' }} src="/images/shap/circle-dots.png" alt="" />
        <img className="pt-img3" style={{ animation: 'rotation 20s infinite linear' }} src="/images/shap/plus-blue.png" alt="" />
        <div className="bg-shape-bottom"></div>
      </div>

      <main>
        <div className="container animate-fade-in">

          {/* Headers */}
          <div className="header-section mb-6">
            <h1>My Availability</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative z-10">

            {/* Custom Tabs */}
            <div className="tabs-header">
              <button
                className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setActiveTab('weekly')}
              >
                Weekly Routine
              </button>
              <button
                className={`tab-btn ${activeTab === 'overrides' ? 'active' : ''}`}
                onClick={() => setActiveTab('overrides')}
              >
                Date Overrides
              </button>
              <button
                className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Preview Options
              </button>
            </div>

            {/* TAB 1: Weekly Routine */}
            {activeTab === 'weekly' && (
              <div className="tab-content active">
                <WeeklyRoutineTab
                  rules={availabilityRules}
                  onUpdate={handleRulesUpdated}
                  getToken={getToken}
                />
              </div>
            )}

            {/* TAB 2: Date Overrides */}
            {activeTab === 'overrides' && (
              <div className="tab-content active">
                <DateOverridesTab
                  rules={availabilityRules}
                  onUpdate={handleRulesUpdated}
                  getToken={getToken}
                />
              </div>
            )}

            {/* TAB 3: Preview */}
            {activeTab === 'preview' && (
              <div className="tab-content active">
                <PreviewTab
                  getToken={getToken}
                />
              </div>
            )}
          </div>
        </div>
      </main>


    </div>
  );
};

export default AvailabilitySettings;
