import React, { useState } from 'react';
import {
  Globe, Search, SlidersHorizontal, ArrowUpDown,
  Building2, Network, LayoutList, X, Check, ShieldCheck
} from 'lucide-react';

const REGIONS_DATA = [
  {
    id: 'reg-india',
    name: 'India',
    flag: '🇮🇳',
    isPrimary: true,
    status: 'Active',
    includes: 'India',
    currency: 'INR (₹)',
    customizations: [
      'Telehealth & In-Clinic Consults',
      'UPI / NetBanking Checkout',
      'Hindi & Regional Language Notes',
      'Standard Home Rehab Protocols'
    ],
    coverageCode: 'IND-PRIMARY',
    timezones: 'IST (UTC +5:30)',
    activeClinics: 14,
    complianceStatus: 'Standard Medical Compliance'
  },
  {
    id: 'reg-usa',
    name: 'United States',
    flag: '🇺🇸',
    isPrimary: false,
    status: 'Active',
    includes: 'United States',
    currency: 'USD ($)',
    customizations: [
      'HIPAA-Compliant Remote Care',
      'Card Checkout & Telehealth',
      'CPT Billing Code Alignment',
      'Post-Op Orthopedic Care'
    ],
    coverageCode: 'USA-EAST/WEST',
    timezones: 'EST / CST / MST / PST',
    activeClinics: 8,
    complianceStatus: 'HIPAA Verified'
  },
  {
    id: 'reg-canada',
    name: 'Canada',
    flag: '🇨🇦',
    isPrimary: false,
    status: 'Active',
    includes: 'Canada',
    currency: 'CAD ($)',
    customizations: [
      'Virtual Physical Therapy',
      'CAD Direct Payment Gateway',
      'Bilingual Care Notices (EN/FR)',
      'Spine & Mobility Rehabilitation'
    ],
    coverageCode: 'CAN-NATL',
    timezones: 'EST / PST / CST',
    activeClinics: 5,
    complianceStatus: 'PIPEDA Aligned'
  },
  {
    id: 'reg-uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    isPrimary: false,
    status: 'Active',
    includes: 'United Kingdom',
    currency: 'GBP (£)',
    customizations: [
      'NHS Reference Coding',
      'Private Healthcare Integration',
      'Remote Shoulder & Knee Protocols',
      'British English Clinical Lexicon'
    ],
    coverageCode: 'UK-GBR',
    timezones: 'GMT / BST (UTC +0/+1)',
    activeClinics: 6,
    complianceStatus: 'GDPR / NHS Aligned'
  }
];

const RegionManagement = () => {
  const [regions] = useState(REGIONS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'graph'
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const filteredRegions = regions
    .filter(reg => {
      if (statusFilter !== 'all' && reg.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        reg.name.toLowerCase().includes(q) ||
        reg.includes.toLowerCase().includes(q) ||
        reg.currency.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Keep India at the top as Primary, then alphabetize
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

  return (
    <div className="w-full min-h-screen bg-[#FFFFFF] font-['Inter',system-ui,sans-serif] text-[#202223] flex flex-col px-4 py-4 md:px-6 md:py-5 gap-6 animate-fade-in">
      
      {/* ── Page Header (Matching Shopify Markets) ──────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#FFFFFF] flex items-center justify-center shrink-0">
            <Globe size={18} />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-[#202223] tracking-tight m-0">
              Regions
            </h1>
            <p className="text-[12px] text-[#616161] mt-0.5 m-0">
              Clinical service territories, localized consultations, and regional compliance standards.
            </p>
          </div>
        </div>

        {/* View Switcher only — Create Region button removed */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode(v => v === 'table' ? 'graph' : 'table')}
            className="btn-secondary-saas flex items-center gap-1.5 text-[12px] cursor-pointer"
          >
            {viewMode === 'table' ? (
              <>
                <Network size={14} className="text-[#616161]" />
                <span>Graph view</span>
              </>
            ) : (
              <>
                <LayoutList size={14} className="text-[#616161]" />
                <span>Table view</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2 shadow-xs">
        <button 
          type="button"
          onClick={() => setSortAsc(v => !v)}
          className="p-1 rounded text-[#8A8A8A] hover:text-[#202223] transition-colors cursor-pointer"
          title="Toggle sort direction"
        >
          <ArrowUpDown size={15} />
        </button>

        <div className="relative flex-1">
          <Search size={15} className="absolute left-1 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search regions by name or currency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-0.5 text-[13px] bg-transparent outline-none text-[#202223] placeholder-[#8A8A8A]"
          />
        </div>

        <div className="flex items-center gap-2 border-l border-[#EAEAEA] pl-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[12px] bg-transparent text-[#616161] font-medium outline-none cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
          </select>
          <SlidersHorizontal size={14} className="text-[#8A8A8A]" />
        </div>
      </div>

      {/* ── VIEW 1: TABLE VIEW (Shopify Markets Exact Layout) ───────── */}
      {viewMode === 'table' && (
        <div className="saas-card overflow-hidden bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse bg-[#FFFFFF]">
              <thead>
                <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider select-none">
                  <th 
                    className="py-3 px-6 cursor-pointer hover:text-[#202223] transition-colors"
                    onClick={() => setSortAsc(v => !v)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Region</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Includes</th>
                  <th className="py-3 px-6">Customizations</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredRegions.map((region) => (
                  <tr
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className="hover:bg-[#F9F9F9] transition-colors cursor-pointer group"
                  >
                    {/* Region Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-[20px] shrink-0">{region.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#202223] group-hover:underline">
                              {region.name}
                            </span>
                            {region.isPrimary && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#111111] text-[#FFFFFF]">
                                Primary
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-[#8A8A8A]">
                            {region.currency} · {region.timezones}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-6">
                      <span className="badge-semantic-success text-[11px] font-medium inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        <span>{region.status}</span>
                      </span>
                    </td>

                    {/* Includes Column */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-[#202223]">
                        <span className="text-[15px]">{region.flag}</span>
                        <span className="font-medium">{region.includes}</span>
                      </div>
                    </td>

                    {/* Customizations Column */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {region.customizations.slice(0, 2).map((custom, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F5F5F5] text-[#202223] border border-[#E5E5E5]"
                          >
                            <Check size={11} className="text-[#10B981]" />
                            <span>{custom}</span>
                          </span>
                        ))}
                        {region.customizations.length > 2 && (
                          <span className="text-[11px] text-[#8A8A8A] self-center">
                            +{region.customizations.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 2: GRAPH TOPOLOGY VIEW ─────────────────────────────── */}
      {viewMode === 'graph' && (
        <div className="saas-card p-6 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
            <div>
              <h3 className="text-[15px] font-semibold text-[#202223] m-0">
                International Clinical Network Topology
              </h3>
              <p className="text-[12px] text-[#616161] mt-0.5 m-0">
                Visual relationship between the 4 active regional operating hubs.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#8A8A8A] bg-[#F7F7F7] px-2 py-1 rounded">
              4 Connected Regions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {regions.map((reg) => (
              <div
                key={reg.id}
                onClick={() => setSelectedRegion(reg)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  reg.isPrimary
                    ? 'border-[#111111] bg-[#FAFAFA] shadow-xs'
                    : 'border-[#E5E5E5] bg-[#FFFFFF] hover:border-[#CCCCCC]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[24px]">{reg.flag}</span>
                  {reg.isPrimary ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#111111] text-[#FFFFFF]">
                      Primary
                    </span>
                  ) : (
                    <span className="badge-semantic-success text-[10px]">Active</span>
                  )}
                </div>
                <h4 className="text-[15px] font-semibold text-[#202223] m-0">
                  {reg.name}
                </h4>
                <div className="text-[11px] text-[#616161] mt-1 space-y-0.5">
                  <div>Currency: <strong className="text-[#202223] font-mono">{reg.currency}</strong></div>
                  <div>Timezone: {reg.timezones}</div>
                  <div>Clinics: {reg.activeClinics} locations</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DETAIL DRAWER (When Clicking a Region) ──────────────────── */}
      {selectedRegion && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
          <div 
            className="w-full max-w-md bg-[#FFFFFF] h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#EAEAEA] flex items-start justify-between bg-[#FAFAFA]">
                <div className="flex items-center gap-3">
                  <span className="text-[28px]">{selectedRegion.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[18px] font-semibold text-[#202223] m-0">
                        {selectedRegion.name}
                      </h3>
                      {selectedRegion.isPrimary && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#111111] text-[#FFFFFF]">
                          Primary Hub
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-[#8A8A8A] font-mono mt-0.5 block">
                      Code: {selectedRegion.coverageCode}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRegion(null)}
                  className="p-1 rounded-lg text-[#616161] hover:text-[#202223] hover:bg-[#F0F0F0] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 flex flex-col gap-6 text-[13px]">
                {/* Status & Compliance */}
                <div className="p-3.5 rounded-xl bg-[#F9F9F9] border border-[#EEEEEE] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#10B981]" />
                    <span className="font-medium text-[#202223]">{selectedRegion.complianceStatus}</span>
                  </div>
                  <span className="badge-semantic-success text-[11px]">
                    {selectedRegion.status}
                  </span>
                </div>

                {/* Regional Details */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                    Territory & Localization
                  </span>
                  <div className="space-y-2.5">
                    <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                      <span className="text-[#616161]">Includes</span>
                      <span className="font-medium text-[#202223]">{selectedRegion.includes}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                      <span className="text-[#616161]">Billing Currency</span>
                      <span className="font-mono font-medium text-[#202223]">{selectedRegion.currency}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                      <span className="text-[#616161]">Operating Timezone</span>
                      <span className="font-mono font-medium text-[#202223]">{selectedRegion.timezones}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#F0F0F0]">
                      <span className="text-[#616161]">Network Facilities</span>
                      <span className="font-medium text-[#202223]">{selectedRegion.activeClinics} Clinics</span>
                    </div>
                  </div>
                </div>

                {/* Customizations */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                    Active Clinical Customizations
                  </span>
                  <div className="flex flex-col gap-2">
                    {selectedRegion.customizations.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5] text-[12px]"
                      >
                        <Check size={14} className="text-[#10B981] shrink-0" />
                        <span className="text-[#202223] font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedRegion(null)}
                className="btn-primary-saas text-[12px] px-4 py-2 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RegionManagement;
