import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import WeeklyRoutineTab from '../components/WeeklyRoutineTab';
import DateOverridesTab from '../components/DateOverridesTab';
import PreviewTab from '../components/PreviewTab';

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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-heading">My Availability</h1>
        <p className="text-body mt-1">Manage your weekly schedule and specific dates off.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'weekly' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-body hover:bg-gray-50 hover:text-dark'
            }`}
          >
            Weekly Routine
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'overrides' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-body hover:bg-gray-50 hover:text-dark'
            }`}
          >
            Date Overrides
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'preview' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-body hover:bg-gray-50 hover:text-dark'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
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
    </div>
  );
};

export default AvailabilitySettings;
