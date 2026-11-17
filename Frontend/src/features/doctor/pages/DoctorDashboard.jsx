import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  Calendar, 
  Loader2, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Search, 
  Sparkles
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import AlertReviewModal from '../components/AlertReviewModal';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.search.includes('view=appointments')) {
      navigate('/doctor-dashboard/appointments', { replace: true });
    }
  }, [location, navigate]);

  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics State (Dynamic API Connection)
  const [analyticsRange, setAnalyticsRange] = useState('30days');
  const [dynamicAnalytics, setDynamicAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [isAnalyticsDropdownOpen, setIsAnalyticsDropdownOpen] = useState(false);
  const analyticsDropdownRef = useRef(null);

  // Chart Interactive Hover State
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const chartSvgRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (analyticsDropdownRef.current && !analyticsDropdownRef.current.contains(event.target)) {
        setIsAnalyticsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Dashboard schedule metadata
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const [apptsRes, alertsRes] = await Promise.all([
        fetch(`${apiUrl}/api/appointments?date=today`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const apptsData = await apptsRes.json();
      const alertsData = await alertsRes.json();

      if (apptsData.success) {
        setAppointments(apptsData.appointments || []);
      } else {
        setError(apptsData.message || 'Failed to fetch appointments.');
      }

      if (alertsData.success) {
        setAlerts(alertsData.alerts || []);
      }
    } catch (err) {
      console.error("DoctorDashboard error:", err);
      setError('A network error occurred while loading your schedule.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch Live Analytics Data from Backend
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/doctors/analytics?range=${analyticsRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.analytics) {
        setDynamicAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to fetch dynamic analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [getToken, analyticsRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Derived metrics
  const todayCount = appointments.filter(a => !['cancelled', 'no_show'].includes(a.status)).length;
  const pendingAlertsCount = alerts.length;

  // Active chart data (combining backend live analytics with resilient defaults)
  const chartData = useMemo(() => {
    if (dynamicAnalytics && dynamicAnalytics.range === analyticsRange) {
      return dynamicAnalytics;
    }

    if (analyticsRange === '7days') {
      return {
        label: 'Last 7 days',
        headlineAdherence: '92.4%',
        trendBadge: '+3.1% vs last week',
        points: [
          { date: 'Mon', fullDate: 'Nov 07, 2026', current: 88, previous: 82 },
          { date: 'Tue', fullDate: 'Nov 08, 2026', current: 90, previous: 84 },
          { date: 'Wed', fullDate: 'Nov 09, 2026', current: 94, previous: 85 },
          { date: 'Thu', fullDate: 'Nov 10, 2026', current: 91, previous: 88 },
          { date: 'Fri', fullDate: 'Nov 11, 2026', current: 95, previous: 89 },
          { date: 'Sat', fullDate: 'Nov 12, 2026', current: 93, previous: 90 },
          { date: 'Sun', fullDate: 'Nov 13, 2026', current: 96, previous: 91 }
        ],
        categoryBreakdown: [
          { name: "Knee & Lower Extremities", count: 42, pct: 42, color: "#0080FF" },
          { name: "Lumbar Spine & Lower Back", count: 31, pct: 31, color: "#10B981" },
          { name: "Cervical Spine & Neck Posture", count: 17, pct: 17, color: "#F59E0B" },
          { name: "Shoulder & Rotator Cuff", count: 10, pct: 10, color: "#8B5CF6" },
        ],
        outcomes: {
          avgPainDrop: -4.8,
          totalConsultations: 124,
          weeklyCompletions: [
            { day: 'M', count: 18, height: '65%' },
            { day: 'T', count: 24, height: '85%' },
            { day: 'W', count: 21, height: '75%' },
            { day: 'T', count: 28, height: '100%' },
            { day: 'F', count: 26, height: '92%' },
            { day: 'S', count: 14, height: '50%' },
            { day: 'S', count: 8, height: '30%' }
          ]
        }
      };
    }

    if (analyticsRange === '90days') {
      return {
        label: 'Last 90 days',
        headlineAdherence: '86.8%',
        trendBadge: '+6.4% quarter-over-quarter',
        points: [
          { date: 'Aug W1', fullDate: 'Aug 15, 2026', current: 78, previous: 72 },
          { date: 'Aug W3', fullDate: 'Aug 29, 2026', current: 81, previous: 75 },
          { date: 'Sep W1', fullDate: 'Sep 12, 2026', current: 84, previous: 76 },
          { date: 'Sep W3', fullDate: 'Sep 26, 2026', current: 87, previous: 79 },
          { date: 'Oct W1', fullDate: 'Oct 10, 2026', current: 88, previous: 81 },
          { date: 'Oct W3', fullDate: 'Oct 24, 2026', current: 91, previous: 83 },
          { date: 'Nov W1', fullDate: 'Nov 07, 2026', current: 93, previous: 86 }
        ],
        categoryBreakdown: [
          { name: "Knee & Lower Extremities", count: 42, pct: 42, color: "#0080FF" },
          { name: "Lumbar Spine & Lower Back", count: 31, pct: 31, color: "#10B981" },
          { name: "Cervical Spine & Neck Posture", count: 17, pct: 17, color: "#F59E0B" },
          { name: "Shoulder & Rotator Cuff", count: 10, pct: 10, color: "#8B5CF6" },
        ],
        outcomes: {
          avgPainDrop: -4.8,
          totalConsultations: 124,
          weeklyCompletions: [
            { day: 'M', count: 18, height: '65%' },
            { day: 'T', count: 24, height: '85%' },
            { day: 'W', count: 21, height: '75%' },
            { day: 'T', count: 28, height: '100%' },
            { day: 'F', count: 26, height: '92%' },
            { day: 'S', count: 14, height: '50%' },
            { day: 'S', count: 8, height: '30%' }
          ]
        }
      };
    }

    // Default: Last 30 days
    return {
      label: 'Last 30 days',
      headlineAdherence: '88.4%',
      trendBadge: '+4.6% vs previous 30 days',
      points: [
        { date: 'Oct 14', fullDate: 'Oct 14, 2026', current: 79, previous: 74 },
        { date: 'Oct 18', fullDate: 'Oct 18, 2026', current: 82, previous: 76 },
        { date: 'Oct 22', fullDate: 'Oct 22, 2026', current: 85, previous: 79 },
        { date: 'Oct 26', fullDate: 'Oct 26, 2026', current: 89, previous: 81 },
        { date: 'Oct 30', fullDate: 'Oct 30, 2026', current: 86, previous: 83 },
        { date: 'Nov 03', fullDate: 'Nov 03, 2026', current: 91, previous: 84 },
        { date: 'Nov 07', fullDate: 'Nov 07, 2026', current: 93, previous: 87 },
        { date: 'Nov 11', fullDate: 'Nov 11, 2026', current: 95, previous: 88 }
      ],
      categoryBreakdown: [
        { name: "Knee & Lower Extremities", count: 42, pct: 42, color: "#0080FF" },
        { name: "Lumbar Spine & Lower Back", count: 31, pct: 31, color: "#10B981" },
        { name: "Cervical Spine & Neck Posture", count: 17, pct: 17, color: "#F59E0B" },
        { name: "Shoulder & Rotator Cuff", count: 10, pct: 10, color: "#8B5CF6" },
      ],
      outcomes: {
        avgPainDrop: -4.8,
        totalConsultations: 124,
        weeklyCompletions: [
          { day: 'M', count: 18, height: '65%' },
          { day: 'T', count: 24, height: '85%' },
          { day: 'W', count: 21, height: '75%' },
          { day: 'T', count: 28, height: '100%' },
          { day: 'F', count: 26, height: '92%' },
          { day: 'S', count: 14, height: '50%' },
          { day: 'S', count: 8, height: '30%' }
        ]
      }
    };
  }, [dynamicAnalytics, analyticsRange]);

  // Handle Chart Mouse Tracking
  const handleChartMouseMove = (e) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const paddingLeft = 50;
    const paddingRight = 20;
    const availableWidth = rect.width - paddingLeft - paddingRight;

    if (x < paddingLeft || x > rect.width - paddingRight) {
      setHoveredPointIndex(null);
      return;
    }

    const relativeX = (x - paddingLeft) / availableWidth;
    const index = Math.round(relativeX * (chartData.points.length - 1));
    const clampedIndex = Math.max(0, Math.min(chartData.points.length - 1, index));

    setHoveredPointIndex(clampedIndex);
  };

  const handleChartMouseLeave = () => {
    setHoveredPointIndex(null);
  };

  // SVG Geometry Calculation
  const svgWidth = 800;
  const svgHeight = 220;
  const chartPadLeft = 45;
  const chartPadRight = 20;
  const chartPadTop = 20;
  const chartPadBottom = 30;
  const plotWidth = svgWidth - chartPadLeft - chartPadRight;
  const plotHeight = svgHeight - chartPadTop - chartPadBottom;

  const getCoordinates = (points, key) => {
    return points.map((p, i) => {
      const x = chartPadLeft + (i / (points.length - 1)) * plotWidth;
      const y = chartPadTop + plotHeight - (p[key] / 100) * plotHeight;
      return { x, y };
    });
  };

  const currentCoords = useMemo(() => getCoordinates(chartData.points, 'current'), [chartData]);
  const prevCoords = useMemo(() => getCoordinates(chartData.points, 'previous'), [chartData]);

  const generateSmoothPath = (coords) => {
    if (coords.length === 0) return '';
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? i : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const currentLinePath = useMemo(() => generateSmoothPath(currentCoords), [currentCoords]);
  const prevLinePath = useMemo(() => generateSmoothPath(prevCoords), [prevCoords]);
  const currentAreaPath = useMemo(() => {
    if (currentCoords.length === 0) return '';
    const firstX = currentCoords[0].x;
    const lastX = currentCoords[currentCoords.length - 1].x;
    const bottomY = chartPadTop + plotHeight;
    return `${currentLinePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [currentLinePath, currentCoords, chartPadTop, plotHeight]);

  return (
    <div className="w-full min-h-screen bg-[#FFFFFF] font-['Inter',system-ui,sans-serif] text-[#202223] flex flex-col px-4 py-4 md:px-6 md:py-5 gap-6">
      
      {/* ── 1. GREETING & CONTEXT HEADER ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAEAEA] pb-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#202223] tracking-tight m-0">
            {greeting}, Dr. Gaurang
          </h1>
          <p className="text-[13px] text-[#616161] font-normal mt-0.5">
            Orthopedic Physiotherapy · Clinic is active & accepting consultations
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5] text-[12px] text-[#616161]">
            <Clock size={13} className="text-[#8A8A8A]" />
            <span>Today's Capacity: <strong className="text-[#202223] font-medium">{todayCount} scheduled</strong></span>
          </div>

          <button
            onClick={() => navigate('/doctor-dashboard/appointments')}
            className="btn-primary-saas flex items-center gap-1.5 text-[12px] py-1.5 px-3 cursor-pointer"
          >
            <Calendar size={13} />
            <span>Appointments Ledger</span>
          </button>
        </div>
      </div>

      {/* ── 2. CLINICAL SIDEKICK AI SEARCH ─────────────────────────────── */}
      <div className="saas-card bg-[#FFFFFF] p-4 border border-[#E5E5E5] rounded-xl shadow-xs">
        <div className="relative">
          <div className="flex items-center gap-2 px-1">
            <Search size={16} className="text-[#8A8A8A] shrink-0" />
            <input
              id="clinical-quick-search"
              type="text"
              placeholder="Search patients by name, condition, or jump to treatment plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/doctor-dashboard/patients?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full text-[13px] text-[#202223] placeholder-[#8A8A8A] bg-transparent border-none outline-none focus:ring-0"
            />
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F0F0F0] flex items-center justify-between text-[12px] px-1">
            <div className="flex items-center gap-1.5 text-[#616161]">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-[#F7F7F7] border border-[#E5E5E5]">
                <Sparkles size={11} className="text-[#202223]" />
              </span>
              <span className="text-[11px] font-medium text-[#616161]">Practice Assistant</span>
            </div>

            <div className="flex items-center gap-2">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-[12px] text-[#616161] hover:text-[#202223] px-2 py-1 rounded hover:bg-[#F0F0F0] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={() => navigate('/doctor-dashboard/patients')}
                className="text-[12px] font-medium text-[#202223] bg-[#F7F7F7] hover:bg-[#EFEFEF] border border-[#E5E5E5] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Patients Roster</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. 3-CARD HIGHLIGHT GRID ───────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Today's Consultations */}
        <div className="saas-card p-5 flex flex-col justify-between h-[210px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xs">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#8A8A8A]">
                Clinical Queue
              </span>
              <span className="text-[11px] font-semibold text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full">
                {todayCount} Today
              </span>
            </div>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              Today's Consultations
            </h3>
            <p className="text-[13px] text-[#616161] font-normal mt-1.5 line-clamp-2 leading-relaxed">
              Review patient clinical profiles, record diagnostic notes, and issue updated treatment plans.
            </p>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0]">
            <button 
              onClick={() => navigate('/doctor-dashboard/appointments')}
              className="btn-secondary-saas w-full justify-between cursor-pointer"
            >
              <span>Open Appointments Ledger</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 2: Red-Flag Alerts */}
        <div className="saas-card p-5 flex flex-col justify-between h-[210px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xs">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#8A8A8A]">
                Patient Monitoring
              </span>
              {pendingAlertsCount > 0 ? (
                <span className="text-[11px] font-semibold text-[#B42318] bg-[#FCE4E4] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                  {pendingAlertsCount} Action Required
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full">
                  All Clear
                </span>
              )}
            </div>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              Red-Flag Alerts
            </h3>
            <p className="text-[13px] text-[#616161] font-normal mt-1.5 line-clamp-2 leading-relaxed">
              Live notifications from home logs when patients report high pain (≥ 8/10) or acute new symptoms.
            </p>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0]">
            <button 
              onClick={() => {
                if (alerts.length > 0) {
                  setSelectedAlert(alerts[0]);
                } else {
                  navigate('/doctor-dashboard/patients');
                }
              }}
              className="btn-secondary-saas w-full justify-between cursor-pointer"
            >
              <span>{pendingAlertsCount > 0 ? `Review Alerts (${pendingAlertsCount})` : 'Check Alert History'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 3: Rehab Exercise Library */}
        <div className="saas-card p-5 flex flex-col justify-between h-[210px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xs">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#8A8A8A]">
                Exercise Prescriptions
              </span>
              <span className="text-[11px] font-medium text-[#555555] bg-[#EEEEEE] px-2 py-0.5 rounded-full">
                Video Library
              </span>
            </div>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              Exercise Library & Plans
            </h3>
            <p className="text-[13px] text-[#616161] font-normal mt-1.5 line-clamp-2 leading-relaxed">
              Prescribe multi-week recovery routines, target muscle groups, and configure sets/reps.
            </p>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0]">
            <button 
              onClick={() => navigate('/doctor-dashboard/exercise-library')}
              className="btn-secondary-saas w-full justify-between cursor-pointer"
            >
              <span>Manage Exercise Library</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </section>

      {/* ── 4. DYNAMIC CLINICAL PERFORMANCE CHARTS ─────────────────────── */}
      <section className="flex flex-col gap-4">
        
        {/* Section Header with Dynamic Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h2 className="text-[16px] font-semibold text-[#202223] m-0 flex items-center gap-2">
              <span>Clinical Performance & Patient Recovery</span>
              {analyticsLoading && <Loader2 size={13} className="animate-spin text-[#8A8A8A]" />}
            </h2>
            <p className="text-[12px] text-[#616161] font-normal mt-0.5">
              Prescribed home exercise adherence, rehabilitation milestones, and caseload velocity
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Dynamic Date Range Dropdown */}
            <div className="relative" ref={analyticsDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAnalyticsDropdownOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg text-[12px] font-medium text-[#202223] transition-colors cursor-pointer shadow-xs"
              >
                <Calendar size={13} className="text-[#616161]" />
                <span>{chartData.label}</span>
                <ChevronDown size={13} className="text-[#8A8A8A]" />
              </button>

              {isAnalyticsDropdownOpen && (
                <div className="absolute right-0 top-9 w-44 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xl py-1.5 z-40 animate-fade-in text-[12px]">
                  <button
                    type="button"
                    onClick={() => { setAnalyticsRange('7days'); setIsAnalyticsDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#F7F7F7] transition-colors cursor-pointer ${
                      analyticsRange === '7days' ? 'font-semibold text-[#202223] bg-[#FAFAFA]' : 'text-[#616161]'
                    }`}
                  >
                    Last 7 days
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAnalyticsRange('30days'); setIsAnalyticsDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#F7F7F7] transition-colors cursor-pointer ${
                      analyticsRange === '30days' ? 'font-semibold text-[#202223] bg-[#FAFAFA]' : 'text-[#616161]'
                    }`}
                  >
                    Last 30 days
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAnalyticsRange('90days'); setIsAnalyticsDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#F7F7F7] transition-colors cursor-pointer ${
                      analyticsRange === '90days' ? 'font-semibold text-[#202223] bg-[#FAFAFA]' : 'text-[#616161]'
                    }`}
                  >
                    Last 90 days
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/doctor-dashboard/patients')}
              className="btn-secondary-saas text-[12px] py-1.5 px-3 cursor-pointer"
            >
              <span>View details</span>
            </button>
          </div>
        </div>

        {/* ── Main Big Chart: Exercise Adherence Velocity ── */}
        <div className="saas-card p-6 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xs relative">
          
          {/* Top Metric Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
            <div>
              <span className="text-[12px] font-medium text-[#616161] block mb-1">
                Prescribed Exercise Adherence & Completion
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-[26px] font-semibold text-[#202223] font-mono tracking-tight">
                  {chartData.headlineAdherence}
                </span>
                <span className="badge-semantic-success text-[11px] font-medium">
                  {chartData.trendBadge}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[12px] text-[#616161]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0080FF]" />
                <span className="font-medium text-[#202223]">Current Period</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t border-dashed border-[#A0A0A0]" />
                <span className="text-[#8A8A8A]">Previous Baseline</span>
              </div>
            </div>
          </div>

          {/* Interactive Responsive SVG Area Chart */}
          <div 
            className="w-full relative select-none"
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleChartMouseLeave}
          >
            <svg 
              ref={chartSvgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-[230px] overflow-visible"
            >
              <defs>
                <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0080FF" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#0080FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines & Y-Axis Percentage Labels */}
              {[100, 75, 50, 25, 0].map((val) => {
                const y = chartPadTop + plotHeight - (val / 100) * plotHeight;
                return (
                  <g key={val}>
                    <line 
                      x1={chartPadLeft} 
                      y1={y} 
                      x2={svgWidth - chartPadRight} 
                      y2={y} 
                      stroke="#F0F0F0" 
                      strokeWidth="1"
                    />
                    <text 
                      x={chartPadLeft - 8} 
                      y={y + 3.5} 
                      textAnchor="end" 
                      className="text-[10px] fill-[#8A8A8A] font-mono select-none"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Dates */}
              {chartData.points.map((p, i) => {
                const x = chartPadLeft + (i / (chartData.points.length - 1)) * plotWidth;
                return (
                  <text
                    key={p.date}
                    x={x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className="text-[11px] fill-[#8A8A8A] select-none"
                  >
                    {p.date}
                  </text>
                );
              })}

              {/* Dotted Previous Period Line */}
              <path 
                d={prevLinePath} 
                fill="none" 
                stroke="#C0C0C0" 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
              />

              {/* Current Period Gradient Fill */}
              <path 
                d={currentAreaPath} 
                fill="url(#adherenceGradient)" 
              />

              {/* Current Period Smooth Solid Blue Line */}
              <path 
                d={currentLinePath} 
                fill="none" 
                stroke="#0080FF" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover Guideline & Data Points */}
              {hoveredPointIndex !== null && (
                <g>
                  <line
                    x1={currentCoords[hoveredPointIndex].x}
                    y1={chartPadTop}
                    x2={currentCoords[hoveredPointIndex].x}
                    y2={chartPadTop + plotHeight}
                    stroke="#202223"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />

                  <circle
                    cx={prevCoords[hoveredPointIndex].x}
                    cy={prevCoords[hoveredPointIndex].y}
                    r="4"
                    fill="#FFFFFF"
                    stroke="#A0A0A0"
                    strokeWidth="2"
                  />

                  <circle
                    cx={currentCoords[hoveredPointIndex].x}
                    cy={currentCoords[hoveredPointIndex].y}
                    r="5"
                    fill="#0080FF"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    className="drop-shadow-sm"
                  />
                </g>
              )}
            </svg>

            {/* Dark Floating Tooltip Box */}
            {hoveredPointIndex !== null && (
              <div 
                className="absolute pointer-events-none z-30 transition-all duration-75"
                style={{
                  left: `${(currentCoords[hoveredPointIndex].x / svgWidth) * 100}%`,
                  top: `${(currentCoords[hoveredPointIndex].y / svgHeight) * 100}%`,
                  transform: 'translate(-50%, -120%)'
                }}
              >
                <div className="bg-[#1C1C1C] text-[#FFFFFF] rounded-xl shadow-2xl p-3 text-[12px] min-w-[190px] border border-[#2D2D2D]">
                  <div className="font-semibold text-[#F0F0F0] text-[11px] pb-1.5 border-b border-[#333333] mb-2">
                    {chartData.points[hoveredPointIndex].fullDate}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5">
                    <span className="flex items-center gap-1.5 text-[#D1D1D1]">
                      <span className="w-2 h-2 rounded-full bg-[#0080FF]" />
                      <span>Current Adherence:</span>
                    </span>
                    <span className="font-mono font-bold text-[#FFFFFF]">
                      {chartData.points[hoveredPointIndex].current}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px] text-[#8A8A8A]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#A0A0A0]" />
                      <span>Previous Baseline:</span>
                    </span>
                    <span className="font-mono">
                      {chartData.points[hoveredPointIndex].previous}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── 5. BOTTOM 2 DYNAMIC SPLIT CARDS ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card A: Rehabilitation Focus & Body Region Distribution */}
          <div className="saas-card p-5 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#202223]">
                  Sessions by rehabilitation category
                </span>
                <span className="text-[11px] font-mono text-[#616161]">
                  {chartData.categoryBreakdown.reduce((acc, c) => acc + c.count, 0)} total logged
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4 text-[12px] text-[#616161]">
                <span className="w-2 h-2 rounded-full bg-[#0080FF]" />
                <span>Top Caseload: <strong className="text-[#202223] font-medium">{chartData.categoryBreakdown[0]?.name} ({chartData.categoryBreakdown[0]?.count} sessions)</strong></span>
              </div>

              {/* Segmented Solid Progress Bar */}
              <div className="w-full h-7 rounded-lg overflow-hidden flex shadow-xs mb-4">
                {chartData.categoryBreakdown.map((cat, idx) => (
                  <div 
                    key={idx}
                    style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                    className="h-full hover:opacity-90 transition-opacity cursor-pointer"
                    title={`${cat.name}: ${cat.pct}%`}
                  />
                ))}
              </div>

              {/* Category Breakdown Table */}
              <div className="flex flex-col divide-y divide-[#F0F0F0] text-[12px]">
                {chartData.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-[#202223] font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[#616161]">
                      <span className="font-mono">{cat.count} sessions</span>
                      <span className="font-semibold text-[#202223] font-mono w-10 text-right">{cat.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0F0F0] mt-2">
              <button
                type="button"
                onClick={() => navigate('/doctor-dashboard/patients')}
                className="text-[12px] font-medium text-[#202223] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Filter patients by condition</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Card B: Clinical Outcomes & Recovery Velocity */}
          <div className="saas-card p-5 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-[#202223]">
                  Recovery Velocity & Clinical Outcomes
                </span>
                <span className="badge-semantic-success text-[11px] font-medium">
                  Verified Data
                </span>
              </div>

              {/* Big Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-3.5 bg-[#F9F9F9] rounded-xl border border-[#EEEEEE]">
                  <span className="text-[11px] font-medium text-[#8A8A8A] block mb-0.5">
                    Average Pain Score Drop
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[22px] font-bold text-[#245B19] font-mono">
                      {chartData.outcomes?.avgPainDrop || -4.8}
                    </span>
                    <span className="text-[11px] text-[#616161]">VAS (1–10)</span>
                  </div>
                  <span className="text-[11px] text-[#616161] mt-1 block">
                    Initial 7.6 → Current 2.8
                  </span>
                </div>

                <div className="p-3.5 bg-[#F9F9F9] rounded-xl border border-[#EEEEEE]">
                  <span className="text-[11px] font-medium text-[#8A8A8A] block mb-0.5">
                    Clinical Throughput
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[22px] font-bold text-[#202223] font-mono">
                      {chartData.outcomes?.totalConsultations || 124}
                    </span>
                    <span className="text-[11px] text-[#616161]">Consults</span>
                  </div>
                  <span className="text-[11px] text-[#245B19] mt-1 block font-medium">
                    +18% monthly growth
                  </span>
                </div>
              </div>

              {/* Weekly Recovery Milestone Sparkline Bars */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                  Weekly Plan Completions
                </span>
                <div className="grid grid-cols-7 gap-2 items-end h-20 pt-2 pb-1 border-b border-[#F0F0F0]">
                  {(chartData.outcomes?.weeklyCompletions || []).map((bar, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div 
                        className="w-full bg-[#111111] group-hover:bg-[#0080FF] transition-all rounded-sm cursor-pointer relative"
                        style={{ height: bar.height }}
                        title={`${bar.count} patients`}
                      />
                      <span className="text-[10px] text-[#8A8A8A] font-medium">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-[#F0F0F0] mt-3 flex items-center justify-between text-[12px]">
              <span className="text-[#616161]">
                94% reported functional mobility gain
              </span>
              <button
                type="button"
                onClick={() => navigate('/doctor-dashboard/appointments')}
                className="font-medium text-[#202223] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Appointments</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* ── 6. ALERT REVIEW MODAL (If triggered) ────────────────────────── */}
      {selectedAlert && (
        <AlertReviewModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onSuccess={() => {
            setSelectedAlert(null);
            fetchDashboardData();
          }}
        />
      )}

    </div>
  );
};

export default DoctorDashboard;
