import React, { useState } from 'react';
import {
  Globe, Plus, Search, SlidersHorizontal, ArrowUpDown,
  Building2, Settings2, Network, LayoutList, X, Check
} from 'lucide-react';

const INITIAL_REGIONS = [
  {
    id: 'reg-1',
    name: 'Metropolitan Central Hub',
    status: 'Active',
    includes: ['Central Care Clinic', 'Downtown Rehab Wing', 'North Medical Tower'],
    customizations: ['Telehealth Consults', 'Extended Evening Shifts', 'Spine Rehab Unit'],
    activePatients: 142,
    leadClinician: 'Dr. Gaurang',
    coverageCode: 'METRO-01'
  },
  {
    id: 'reg-2',
    name: 'Western Regional District',
    status: 'Active',
    includes: ['Westside Physiotherapy Annex', 'Suburban Wellness Center'],
    customizations: ['Post-Op Knee Protocols', 'Pediatric Care Unit'],
    activePatients: 89,
    leadClinician: 'Dr. Gaurang',
    coverageCode: 'WEST-02'
  },
  {
    id: 'reg-3',
    name: 'Southern Outpatient Network',
    status: 'Active',
    includes: ['Bayview Sports Clinic', 'Harbor Health Suites'],
    customizations: ['Athletic Performance Lab', 'Weekend Routine'],
    activePatients: 64,
    leadClinician: 'Dr. Gaurang',
    coverageCode: 'SOUTH-03'
  },
  {
    id: 'reg-4',
    name: 'Northern Community Outreach',
    status: 'Draft',
    includes: ['Highland Annex (Opening Q1)'],
    customizations: ['Standard Regimens', 'Mobile Rehab Units'],
    activePatients: 0,
    leadClinician: 'Dr. Gaurang',
    coverageCode: 'NORTH-04'
  }
];

const RegionManagement = () => {
  const [regions, setRegions] = useState(INITIAL_REGIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'graph'
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals / Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Create Form State
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formIncludes, setFormIncludes] = useState('');
  const [formCustomizations, setFormCustomizations] = useState(['Telehealth Consults']);

  const handleCreateRegion = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const includesArray = formIncludes.split(',').map(s => s.trim()).filter(Boolean);
    const newRegion = {
      id: `reg-${Date.now()}`,
      name: formName.trim(),
      status: formStatus,
      includes: includesArray.length > 0 ? includesArray : ['General Outreach Facility'],
      customizations: formCustomizations.length > 0 ? formCustomizations : ['Standard Regimens'],
      activePatients: 0,
      leadClinician: 'Dr. Gaurang',
      coverageCode: `REG-${Math.floor(10 + Math.random() * 90)}`
    };

    setRegions([newRegion, ...regions]);
    setIsCreateModalOpen(false);
    setFormName('');
    setFormIncludes('');
    setFormCustomizations(['Telehealth Consults']);
  };

  const toggleCustomization = (item) => {
    setFormCustomizations(prev =>
      prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
    );
  };

  const filteredRegions = regions
    .filter(reg => {
      if (statusFilter !== 'all' && reg.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        reg.name.toLowerCase().includes(q) ||
        reg.coverageCode.toLowerCase().includes(q) ||
        reg.includes.some(inc => inc.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      return sortAsc 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-['Inter',system-ui,sans-serif] text-[#202223] animate-fade-in">
      
      {/* ── Page Header matching Shopify "Markets" UI ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#FFFFFF] flex items-center justify-center shrink-0">
            <Globe size={18} />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-[#202223] tracking-tight m-0">
              Regions
            </h1>
            <p className="text-[12px] text-[#616161] mt-0.5 m-0">
              Manage clinical service regions, facility networks, and regional customization rules.
            </p>
          </div>
        </div>

        {/* Header Right Actions: Graph View & Create Region */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode(v => v === 'table' ? 'graph' : 'table')}
            className="btn-secondary-saas flex items-center gap-1.5 text-[12px]"
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

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary-saas flex items-center gap-1.5 text-[12px]"
          >
            <Plus size={14} />
            <span>Create region</span>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Bar matching Shopify Markets ────────────── */}
      <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-2 shadow-xs">
        <button 
          type="button"
          onClick={() => setSortAsc(v => !v)}
          className="p-1 rounded text-[#8A8A8A] hover:text-[#202223] transition-colors"
          title="Toggle sort direction"
        >
          <ArrowUpDown size={15} />
        </button>

        <div className="relative flex-1">
          <Search size={15} className="absolute left-1 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search in all regions..."
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
            <option value="draft">Draft only</option>
          </select>
          <SlidersHorizontal size={14} className="text-[#8A8A8A]" />
        </div>
      </div>

      {/* ── VIEW 1: TABLE VIEW (Shopify Markets Exact Layout) ───────── */}
      {viewMode === 'table' && (
        <div className="saas-card overflow-hidden bg-[#FFFFFF]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider">
                  <th 
                    className="py-3 px-5 cursor-pointer hover:text-[#202223] transition-colors select-none"
                    onClick={() => setSortAsc(v => !v)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Region</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Includes</th>
                  <th className="py-3 px-5">Customizations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredRegions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-[#8A8A8A]">
                      <Globe size={24} className="mx-auto mb-2 text-[#CCCCCC]" />
                      <span className="text-[14px] font-medium text-[#202223] block">No regions found</span>
                      <span className="text-[12px] text-[#616161] mt-0.5 block">
                        {searchQuery ? `No matches for "${searchQuery}"` : 'Get started by creating your first service region.'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredRegions.map((region) => (
                    <tr
                      key={region.id}
                      onClick={() => setSelectedRegion(region)}
                      className="hover:bg-[#F9F9F9] transition-colors cursor-pointer group"
                    >
                      {/* Region Column */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Globe size={16} className="text-[#616161] group-hover:text-[#111111] transition-colors shrink-0" />
                          <div>
                            <span className="font-semibold text-[#202223] block group-hover:underline">
                              {region.name}
                            </span>
                            <span className="text-[11px] font-mono text-[#8A8A8A]">
                              {region.coverageCode} • {region.activePatients} patients
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-5">
                        {region.status === 'Active' ? (
                          <span className="badge-semantic-success text-[11px] font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="badge-semantic-neutral text-[11px] font-medium">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Includes Column */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {region.includes.map((facility, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-[12px] text-[#202223]"
                            >
                              <Building2 size={11} className="text-[#8A8A8A]" />
                              <span>{facility}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Customizations Column */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2 text-[#616161]">
                          {region.customizations.map((cust, idx) => (
                            <span 
                              key={idx}
                              title={cust}
                              className="p-1.5 rounded-md bg-[#F7F7F7] hover:bg-[#EAEAEA] border border-[#E5E5E5] text-[#202223] text-[11px] flex items-center gap-1"
                            >
                              <Settings2 size={12} className="text-[#8A8A8A]" />
                              <span className="hidden md:inline">{cust}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 2: GRAPH VIEW (Network Visualization) ──────────────── */}
      {viewMode === 'graph' && (
        <div className="saas-card p-6 bg-[#FFFFFF] flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
            <div>
              <h3 className="text-[15px] font-semibold text-[#202223] m-0">
                Regional Clinical Topology
              </h3>
              <p className="text-[12px] text-[#616161] mt-0.5 m-0">
                Interactive organizational map of clinical hubs and satellite physiotherapy wings.
              </p>
            </div>
            <span className="badge-semantic-neutral">
              {filteredRegions.length} Active Nodes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRegions.map((region) => (
              <div
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                className="p-4 rounded-xl border border-[#E5E5E5] hover:border-[#202223] bg-[#FAFAFA] hover:bg-[#FFFFFF] transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="w-8 h-8 rounded-lg bg-[#111111] text-[#FFFFFF] flex items-center justify-center shrink-0">
                      <Globe size={16} />
                    </span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                      region.status === 'Active' ? 'badge-semantic-success' : 'badge-semantic-neutral'
                    }`}>
                      {region.status}
                    </span>
                  </div>

                  <h4 className="text-[15px] font-semibold text-[#202223] m-0">
                    {region.name}
                  </h4>
                  <span className="text-[11px] font-mono text-[#8A8A8A] block mt-0.5">
                    {region.coverageCode} • {region.activePatients} patients assigned
                  </span>
                </div>

                <div className="pt-2 border-t border-[#EAEAEA] flex flex-col gap-1.5 text-[12px]">
                  <span className="text-[#8A8A8A] text-[11px] font-medium uppercase tracking-wider">
                    Facilities ({region.includes.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {region.includes.map((f, i) => (
                      <span key={i} className="text-[11px] bg-[#FFFFFF] border border-[#E5E5E5] px-2 py-0.5 rounded text-[#202223]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CREATE REGION MODAL ─────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
          <div 
            className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-[#FAFAFA]">
              <div className="flex items-center gap-2.5">
                <Globe size={18} className="text-[#202223]" />
                <h3 className="text-[16px] font-semibold text-[#202223] m-0">
                  Create Regional Market
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-1.5 rounded-lg text-[#616161] hover:text-[#202223] hover:bg-[#F0F0F0] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateRegion} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="text-[12px] font-semibold text-[#202223] block mb-1">
                  Region Name <span className="text-[#E5484D]">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Eastern Coast Care District"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223]"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#202223] block mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223]"
                >
                  <option value="Active">Active (Open for patient intake)</option>
                  <option value="Draft">Draft (Setup mode)</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#202223] block mb-1">
                  Included Facilities & Outposts (Comma-separated)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Harbor Physiocenter, East Wing Annex, Hillside Clinic"
                  value={formIncludes}
                  onChange={(e) => setFormIncludes(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223]"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#202223] block mb-2">
                  Regional Capabilities & Customizations
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Telehealth Consults',
                    'Extended Evening Shifts',
                    'Spine Rehab Unit',
                    'Post-Op Knee Protocols',
                    'Athletic Performance Lab',
                    'Weekend Routine'
                  ].map((cust) => {
                    const isSelected = formCustomizations.includes(cust);
                    return (
                      <button
                        type="button"
                        key={cust}
                        onClick={() => toggleCustomization(cust)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#111111] text-[#FFFFFF]'
                            : 'bg-[#F7F7F7] text-[#616161] hover:bg-[#EAEAEA] border border-[#E5E5E5]'
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{cust}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-[#EAEAEA] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary-saas text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-saas text-[12px] flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Create Region</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REGION DETAIL DRAWER / MODAL ────────────────────────────── */}
      {selectedRegion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
          <div 
            className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-[#FAFAFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#FFFFFF] flex items-center justify-center">
                  <Globe size={16} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#202223] m-0">
                    {selectedRegion.name}
                  </h3>
                  <span className="text-[11px] font-mono text-[#8A8A8A]">
                    Coverage Code: {selectedRegion.coverageCode}
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setSelectedRegion(null)} 
                className="p-1.5 rounded-lg text-[#616161] hover:text-[#202223] hover:bg-[#F0F0F0] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Details */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto text-[13px]">
              <div className="flex items-center justify-between p-3 bg-[#F7F7F7] rounded-xl border border-[#E5E5E5]">
                <span className="text-[#616161]">Current Operation Status:</span>
                <span className={`text-[11px] font-medium ${
                  selectedRegion.status === 'Active' ? 'badge-semantic-success' : 'badge-semantic-neutral'
                }`}>
                  {selectedRegion.status}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                  Encompassed Medical Outposts & Clinics ({selectedRegion.includes.length})
                </span>
                <div className="divide-y divide-[#EAEAEA] border border-[#E5E5E5] rounded-xl overflow-hidden bg-[#FFFFFF]">
                  {selectedRegion.includes.map((f, i) => (
                    <div key={i} className="p-3 flex items-center justify-between text-[#202223]">
                      <span className="font-medium flex items-center gap-2">
                        <Building2 size={13} className="text-[#616161]" /> {f}
                      </span>
                      <span className="badge-semantic-success text-[10px]">Operational</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                  Configured Regional Customizations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRegion.customizations.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-[12px] font-medium text-[#202223]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between text-[12px] text-[#616161]">
                <span>Registered Patients: <strong className="text-[#202223] font-mono">{selectedRegion.activePatients}</strong></span>
                <span>Lead Clinician: <strong className="text-[#202223]">{selectedRegion.leadClinician}</strong></span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedRegion(null)}
                className="btn-primary-saas text-[12px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RegionManagement;
