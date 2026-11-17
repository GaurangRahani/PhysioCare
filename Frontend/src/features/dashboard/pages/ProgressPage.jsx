import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { format, isFuture as isDateFuture, parseISO, subDays } from 'date-fns';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  TrendingDown,
  Dumbbell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Activity,
  ListChecks,
  Clock
} from 'lucide-react';

const ProgressPage = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timeframe selector for graph ('7days' | '14days' | 'all')
  const [timeframe, setTimeframe] = useState('7days');

  // Calendar & Logs State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});

  const toggleLogExpand = (name) => {
    setExpandedLogs(prev => ({ ...prev, [name]: !prev[name] }));
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) throw new Error('Failed to fetch patient profile');
      const profileData = await profileResponse.json();
      if (!profileData.profile) throw new Error('Patient profile not found. Please complete onboarding.');
      const patientId = profileData.user.id;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${patientId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setData(null);
          return;
        }
        throw new Error(json.message || 'Failed to fetch progress');
      }

      setData(json);

      // Auto-select today
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      setSelectedDateStr(todayStr);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFreq = (type) => {
    const map = {
      daily: 'Daily',
      alternate_days: 'Alternate Days',
      mon_wed_fri: 'Mon/Wed/Fri',
      tue_thu_sat: 'Tue/Thu/Sat',
      custom_days: 'Custom Days'
    };
    return map[type] || type || 'Daily';
  };

  const getComplianceColor = (pct) => {
    if (pct >= 80) return 'text-[#245B19] bg-[#D9F7C3]';
    if (pct >= 50) return 'text-[#8A6116] bg-[#FFF2CC]';
    return 'text-[#B81818] bg-[#FCE4E4]';
  };

  const getProgressColor = (pct) => {
    if (pct >= 80) return 'bg-[#008060]';
    if (pct >= 50) return 'bg-[#B98900]';
    return 'bg-[#D72C0D]';
  };

  // ── 1. DYNAMIC RECHARTS DATA (7 DAYS, 14 DAYS, ALL TIME) ─────────────────
  const { plan, overallCompliance = 0, exercises = [], calendarData = [] } = data || {};

  const chartData = useMemo(() => {
    if (!calendarData) return [];

    const today = new Date();
    let daysCount = 7;

    if (timeframe === '14days') {
      daysCount = 14;
    } else if (timeframe === 'all') {
      let startDate = null;
      if (plan && plan.start_date) {
        startDate = new Date(plan.start_date);
      } else if (calendarData.length > 0) {
        const dates = calendarData
          .map(r => r.scheduled_date ? new Date(r.scheduled_date.split('T')[0]).getTime() : null)
          .filter(Boolean);
        if (dates.length > 0) startDate = new Date(Math.min(...dates));
      }

      if (startDate && !isNaN(startDate.getTime())) {
        const diff = Math.ceil((today.getTime() - startDate.getTime()) / 86400000) + 1;
        daysCount = Math.min(90, Math.max(7, diff));
      } else {
        daysCount = 30;
      }
    }

    const result = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLabel = format(d, 'dd MMM');

      const dayRows = calendarData.filter(r => r.scheduled_date && r.scheduled_date.split('T')[0] === dateStr);

      let avgPain = 0;
      let compliance = 0;

      if (dayRows.length > 0) {
        const completed = dayRows.filter(r => r.status === 'completed' || r.sets_completed > 0).length;
        compliance = Math.round((completed / dayRows.length) * 100);

        const rowsWithPain = dayRows.filter(r => r.pain_level !== null && r.pain_level !== undefined);
        if (rowsWithPain.length > 0) {
          avgPain = parseFloat((rowsWithPain.reduce((sum, r) => sum + Number(r.pain_level), 0) / rowsWithPain.length).toFixed(1));
        }
      }

      result.push({
        name: dayLabel,
        pain: avgPain,
        compliance: compliance
      });
    }

    return result;
  }, [calendarData, timeframe, plan]);

  // Dynamic bar sizing according to timeframe count
  const dynamicBarSize = useMemo(() => {
    if (timeframe === '7days') return 20;
    if (timeframe === '14days') return 13;
    return Math.max(4, Math.min(10, Math.floor(220 / Math.max(1, chartData.length))));
  }, [timeframe, chartData.length]);

  // XAxis tick interval to avoid label collisions on mobile
  const xAxisInterval = useMemo(() => {
    if (timeframe === '7days') return 0;
    if (timeframe === '14days') return 1;
    return Math.max(1, Math.ceil(chartData.length / 6));
  }, [timeframe, chartData.length]);

  // ── 2. CALENDAR LOGIC ───────────────────────────────────────────────────
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i), 'yyyy-MM-dd');
      const dayRows = (calendarData || []).filter(r => r.scheduled_date && r.scheduled_date.split('T')[0] === dateStr);
      const isFuture = isDateFuture(new Date(dateStr)) && format(new Date(), 'yyyy-MM-dd') !== dateStr;

      let dotType = 'rest';
      if (dayRows.length > 0) {
        if (isFuture) {
          dotType = 'future';
        } else {
          const completed = dayRows.filter(r => r.status === 'completed' || r.sets_completed > 0).length;
          const total = dayRows.length;
          if (completed === total) dotType = 'complete';
          else if (completed > 0) dotType = 'partial';
          else dotType = 'missed';
        }
      }

      days.push({
        date: i,
        dateStr,
        dotType,
        isFuture,
        sessionsCount: dayRows.length,
        key: dateStr
      });
    }
    return days;
  }, [currentMonth, calendarData, daysInMonth, firstDayOfMonth]);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const handleJumpToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDateStr(format(today, 'yyyy-MM-dd'));
  };

  // ── 3. GROUPED LOGS FOR SELECTED DATE (CLICK TO OPEN TABLE DETAILS) ─────
  const groupedLogs = useMemo(() => {
    if (!selectedDateStr || !calendarData) return {};
    const selectedDaySessions = calendarData.filter(r => r.scheduled_date && r.scheduled_date.split('T')[0] === selectedDateStr);
    const selectedDayLogs = selectedDaySessions.filter(s => s.pain_level !== null || s.issue_type || s.comments);

    const grouped = {};
    selectedDayLogs.forEach(log => {
      const name = log.exercise_name || 'Reported Concern';
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(log);
    });
    return grouped;
  }, [selectedDateStr, calendarData]);

  // ── 4. RENDER STATES ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <div className="w-8 h-8 border-2 border-[#202223] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[13px] text-[#616161]">Loading recovery trajectory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-[#FCE4E4] border border-[#F5C2C2] text-[#B81818] rounded-[10px] text-[13px]">
        {error}
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 sm:p-12 text-center bg-[#FFFFFF] border border-dashed border-[#EAEAEA] rounded-[16px] my-6">
        <Activity size={36} className="text-[#8A8A8A] mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-semibold text-[#202223]">No active treatment plan found</h3>
        <p className="text-[13px] text-[#616161] mt-1 max-w-sm mx-auto">
          Your physical therapist will publish a customized rehabilitation protocol for you soon.
        </p>
      </div>
    );
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(plan.end_date) - new Date()) / 86400000));

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-5 pb-12 font-['Inter',system-ui,sans-serif] text-[#202223] animate-fade-in">

      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#EAEAEA] pb-3">
        <div className="min-w-0">
          <h1 className="text-[19px] md:text-[22px] font-semibold text-[#202223] tracking-tight m-0 truncate">
            Progress & History
          </h1>

        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#D9F7C3] text-[#245B19] rounded-full text-[11px] sm:text-[12px] font-medium font-mono border border-[#C2E8AA]">
            <span className="w-2 h-2 rounded-full bg-[#008060]" />
            {overallCompliance}% Overall Compliance
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F7F7] text-[#616161] rounded-full text-[11px] sm:text-[12px] font-medium font-mono border border-[#E5E5E5]">
            <Clock size={12} className="text-[#8A8A8A]" />
            {daysLeft} days left
          </span>
        </div>
      </div>

      {/* ── 2. TWO-COLUMN RESPONSIVE LAYOUT ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full max-w-full min-w-0">

        {/* ── LEFT COLUMN (lg:col-span-7): Chart + Protocol Breakdown ── */}
        <div className="lg:col-span-7 space-y-5 w-full max-w-full min-w-0">

          {/* PAIN & COMPLIANCE COMPOSED CHART (WITH 7D, 14D, ALL-TIME TOGGLES) */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-3.5 sm:p-5 shadow-xs w-full max-w-full min-w-0 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#F0F0F0] gap-3">
              {/* Left & Middle: Daily Overview title + Legend right near it */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-wrap">
                <div>
                  <h2 className="text-sm font-semibold text-[#202223] tracking-tight m-0">
                    Daily Overview
                  </h2>
                  <span className="text-[11px] sm:text-[12px] text-[#616161]">
                    Exercise Completion vs. Reported Pain
                  </span>
                </div>

                {/* Legend placed right near Daily Overview */}
                <div className="flex items-center gap-3 text-[11px] text-[#616161] sm:pl-3.5 sm:border-l sm:border-[#EAEAEA]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#0080FF]" />
                    <span className="font-medium text-[#202223]">Compliance %</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D72C0D]" />
                    <span>Pain (0–10)</span>
                  </div>
                </div>
              </div>

              {/* Right: 7 Day / 14 Day / All Time Toggle Pills */}
              <div className="flex items-center self-start md:self-auto bg-[#F7F7F7] p-0.5 rounded-lg border border-[#E5E5E5] text-[11px] font-medium shrink-0">
                {[
                  { id: '7days', label: '7 Days' },
                  { id: '14days', label: '14 Days' },
                  { id: 'all', label: 'All Time' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeframe(t.id)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      timeframe === t.id
                        ? 'bg-[#FFFFFF] text-[#202223] font-semibold shadow-xs'
                        : 'text-[#616161] hover:text-[#202223]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Area */}
            <div 
              className="h-[260px] sm:h-[320px] w-full max-w-full min-w-0 pt-3 outline-none focus:outline-none focus:ring-0 [&_*]:outline-none [&_*]:focus:outline-none select-none"
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <ComposedChart 
                    data={chartData} 
                    margin={{ top: 10, right: 10, bottom: 0, left: -25 }}
                    style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#8A8A8A', fontSize: 10 }}
                      interval={xAxisInterval}
                      dy={6}
                    />
                    <YAxis yAxisId="left" hide domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" hide domain={[0, 10]} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #EAEAEA',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '11px',
                        backgroundColor: '#FFFFFF',
                        color: '#202223'
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="compliance"
                      name="Compliance %"
                      fill="#0080FF"
                      radius={[4, 4, 0, 0]}
                      barSize={dynamicBarSize}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pain"
                      name="Pain Level"
                      stroke="#D72C0D"
                      strokeWidth={2}
                      dot={{ stroke: '#D72C0D', strokeWidth: 1.5, fill: '#FFFFFF', r: 3 }}
                      activeDot={{ r: 4.5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[12px] text-[#8A8A8A]">
                  No pain trend recorded yet.
                </div>
              )}
            </div>

            {/* Clinical Insight Footer */}
            <div className="mt-3 p-2.5 bg-[#FBFBFB] border border-[#F0F0F0] rounded-[8px] flex items-center gap-2 text-[11px] sm:text-[12px] text-[#616161]">
              <TrendingDown size={15} className="text-[#008060] shrink-0" />
              <span>Insight: Consistent daily compliance directly correlates with pain reduction over time.</span>
            </div>
          </div>

          {/* ACTIVE PROTOCOL & EXERCISE BREAKDOWN */}
          <div className="space-y-5 w-full max-w-full min-w-0">
            {/* Active Protocol Summary */}
            <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-3.5 sm:p-5 shadow-xs space-y-3.5 w-full max-w-full min-w-0">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#F0F0F0] gap-2">
                <div className="min-w-0 pr-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A] block">Active Protocol</span>
                  <h3 className="text-[13px] sm:text-sm font-semibold text-[#202223] mt-0.5 truncate">{plan.title}</h3>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#D9F7C3] text-[#245B19] font-mono shrink-0">
                  {daysLeft}d left
                </span>
              </div>

              {/* Duration progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#616161]">
                  <span>Timeline Progress</span>
                  <span className="font-mono">Week {plan.week_number} of {plan.total_weeks}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F4F4F4] overflow-hidden">
                  <div
                    className="h-full bg-[#202223] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, plan.duration_progress_percent || 0)}%` }}
                  />
                </div>
              </div>

              {/* Overall compliance */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#616161]">
                  <span>Prescribed Compliance</span>
                  <span className="font-mono font-semibold text-[#202223]">{overallCompliance}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F4F4F4] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getProgressColor(overallCompliance)}`}
                    style={{ width: `${Math.min(100, overallCompliance)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Prescribed Exercise Breakdown */}
            <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-3.5 sm:p-5 shadow-xs space-y-3 w-full max-w-full min-w-0">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
                <h3 className="text-[13px] sm:text-sm font-semibold text-[#202223]">
                  Prescribed Exercise Breakdown
                </h3>
                <ListChecks size={15} className="text-[#8A8A8A]" />
              </div>

              <div className={`space-y-2 pr-1 ${exercises.length > 2 ? 'max-h-[168px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#D5D5D5] [&::-webkit-scrollbar-thumb]:rounded-full' : ''}`}>
                {exercises.map((ex) => {
                  const needsAttention = (ex.session_compliance_percent || 0) < 50;
                  return (
                    <div key={ex.tpe_id || ex.id} className="p-2.5 sm:p-3 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-[12px] sm:text-[13px] font-medium text-[#202223] truncate">{ex.exercise_name}</h4>
                          <span className="text-[10px] sm:text-[11px] text-[#8A8A8A] block truncate">
                            {formatFreq(ex.frequency_type)} · {ex.sessions_per_day || 1}x/day · {ex.prescribed_sets}×{ex.prescribed_reps}
                          </span>
                        </div>
                        {needsAttention && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-[#FCE4E4] text-[#B81818] shrink-0">
                            ATTN
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] sm:text-[11px] text-[#616161]">
                          <span>Compliance</span>
                          <span className="font-mono font-medium">{ex.session_compliance_percent || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(ex.session_compliance_percent || 0)}`}
                            style={{ width: `${Math.min(100, ex.session_compliance_percent || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (lg:col-span-5): SESSION CALENDAR & TOGGLEABLE DAILY LOGS TOGETHER ── */}
        <div className="lg:col-span-5 space-y-5 w-full max-w-full min-w-0">

          {/* INTERACTIVE CALENDAR & DATE LOG CARD */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-3.5 sm:p-5 shadow-xs space-y-3.5 w-full max-w-full min-w-0">

            {/* Calendar Header with Month Navigation (flex-wrap to prevent 320px overflow) */}
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#F0F0F0] gap-2">
              <span className="text-[13px] sm:text-sm font-semibold text-[#202223]">Session Calendar</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleJumpToday}
                  className="px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-[#616161] hover:text-[#202223] bg-[#F7F7F7] hover:bg-[#EFEFEF] border border-[#E5E5E5] rounded transition-colors cursor-pointer mr-1"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-md text-[#8A8A8A] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-[11px] sm:text-[12px] font-medium text-[#202223] min-w-[75px] text-center font-mono">
                  {format(currentMonth, 'MMM yyyy')}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-md text-[#8A8A8A] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#8A8A8A] uppercase">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="py-0.5">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] sm:text-[12px]">
              {calendarDays.map((day) => {
                if (day.empty) return <div key={day.key} className="py-1.5" />;

                const isSelected = selectedDateStr === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    disabled={day.isFuture}
                    onClick={() => !day.isFuture && setSelectedDateStr(day.dateStr)}
                    className={`relative py-1.5 rounded-[7px] flex flex-col items-center justify-center transition-colors ${isSelected
                      ? 'bg-[#202223] text-[#FFFFFF] font-bold shadow-xs'
                      : day.isFuture
                        ? 'text-[#D0D0D0] cursor-default'
                        : 'text-[#202223] hover:bg-[#F4F4F4] cursor-pointer'
                      }`}
                  >
                    <span>{day.date}</span>
                    {day.dotType !== 'rest' && !day.isFuture && (
                      <span className={`w-1 h-1 rounded-full mt-0.5 ${day.dotType === 'complete' ? 'bg-[#008060]' :
                        day.dotType === 'partial' ? 'bg-[#B98900]' : 'bg-[#D72C0D]'
                        }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-[#8A8A8A] border-t border-[#F0F0F0]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008060]" /> Done
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B98900]" /> Partial
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D72C0D]" /> Missed
              </span>
            </div>

            {/* ── DIRECTLY ATTACHED DAILY LOG FOR SELECTED DATE (CLICK TO EXPAND) ── */}
            <div className="pt-3 border-t border-[#F0F0F0] space-y-2.5 w-full max-w-full min-w-0">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon size={13} className="text-[#8A8A8A]" />
                  <h3 className="text-[12px] sm:text-sm font-semibold text-[#202223] m-0">
                    Daily Log & Symptoms
                  </h3>
                </div>
                <span className="text-[11px] sm:text-[12px] font-medium text-[#616161]">
                  {selectedDateStr ? format(parseISO(selectedDateStr), 'MMM d, yyyy') : 'Selected Date'}
                </span>
              </div>

              {Object.keys(groupedLogs).length > 0 ? (
                <div className="space-y-2 pt-1 w-full max-w-full min-w-0">
                  {Object.keys(groupedLogs).map((exerciseName, idx) => (
                    <div
                      key={idx}
                      className="border border-[#EAEAEA] rounded-[10px] overflow-hidden w-full max-w-full min-w-0"
                    >
                      <button
                        type="button"
                        onClick={() => toggleLogExpand(exerciseName)}
                        className="w-full p-2.5 bg-[#FBFBFB] hover:bg-[#F4F4F4] transition-colors flex items-center justify-between text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-[12px] sm:text-[13px] font-medium text-[#202223] min-w-0 pr-1">
                          <Dumbbell size={13} className="text-[#8A8A8A] shrink-0" />
                          <span className="truncate">{exerciseName}</span>
                          <span className="text-[10px] sm:text-[11px] text-[#8A8A8A] shrink-0">
                            ({groupedLogs[exerciseName].length})
                          </span>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-[#8A8A8A] shrink-0 transition-transform duration-200 ${expandedLogs[exerciseName] ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {expandedLogs[exerciseName] && (
                        <div className="p-2.5 bg-[#FFFFFF] border-t border-[#EAEAEA] overflow-x-auto w-full max-w-full">
                          <table className="w-full text-left text-[11px]">
                            <thead>
                              <tr className="border-b border-[#F0F0F0] text-[#8A8A8A]">
                                <th className="pb-1.5 font-medium">#</th>
                                <th className="pb-1.5 font-medium">Pain</th>
                                <th className="pb-1.5 font-medium">Issue</th>
                                <th className="pb-1.5 font-medium">Comments</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F0F0]">
                              {groupedLogs[exerciseName].map((log, logIdx) => (
                                <tr key={logIdx} className="text-[#202223]">
                                  <td className="py-1.5 font-mono text-[#8A8A8A]">{logIdx + 1}</td>
                                  <td className="py-1.5">
                                    {log.pain_level !== null ? (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FFF2CC] text-[#8A6116]">
                                        {log.pain_level}/10
                                      </span>
                                    ) : '—'}
                                  </td>
                                  <td className="py-1.5">
                                    {log.issue_type ? (
                                      <span className="text-[#616161] truncate block max-w-[70px]">{log.issue_type}</span>
                                    ) : '—'}
                                  </td>
                                  <td className="py-1.5 text-[#616161] max-w-[120px] truncate">
                                    {log.comments || 'No comments'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 sm:p-5 text-center text-[#8A8A8A] text-[11px] sm:text-[12px] bg-[#FBFBFB] rounded-[8px] border border-dashed border-[#EAEAEA]">
                  <CheckCircle2 size={20} className="mx-auto mb-1 opacity-50 text-[#008060]" />
                  No symptoms or specific discomfort reported on this date.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ProgressPage;