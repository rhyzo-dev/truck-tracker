import React, { useState, useEffect, useCallback } from 'react';
import { supabase, TruckVisit, TruckStatus, Plant, LogisticCompany, Truck, STATUS_LABELS, STATUS_COLORS, STATUS_ORDER } from './lib/supabase';
import { LogIn, LogOut, Plus, X, Clock, Truck as TruckIcon, Filter, ChevronDown, Download, Calendar } from 'lucide-react';

// ------------------ Auth ------------------
function AuthPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <TruckIcon size={48} className="auth-icon" />
          <h2>Check your email</h2>
          <p>We sent a magic link to <strong>{email}</strong>. Click the link to sign in.</p>
          <button className="btn btn-secondary" onClick={() => setSent(false)}>
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <TruckIcon size={48} className="auth-icon" />
        <h1>Truck Tracker</h1>
        <p className="auth-subtitle">Sign in to access the dashboard</p>
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          autoFocus
        />
        <button className="btn btn-primary" onClick={handleLogin} disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </div>
    </div>
  );
}

// ------------------ Entry Form ------------------
function EntryForm({
  plants,
  logisticCompanies,
  trucks,
  onClose,
  onSaved,
  editVisit,
}: {
  plants: Plant[];
  logisticCompanies: LogisticCompany[];
  trucks: Truck[];
  onClose: () => void;
  onSaved: () => void;
  editVisit?: TruckVisit | null;
}) {
  const [form, setForm] = useState({
    visit_date: editVisit?.visit_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    plant_id: editVisit?.plant_id || '',
    truck_id: editVisit?.truck_id || '',
    contact_no: editVisit?.contact_no || '',
    destination: editVisit?.destination || '',
    logistic_company_id: editVisit?.logistic_company_id || '',
    status: (editVisit?.status || 'scheduled') as TruckStatus,
    time_in: editVisit?.time_in?.split('T')[1]?.slice(0, 5) || '',
    time_out: editVisit?.time_out?.split('T')[1]?.slice(0, 5) || '',
    issue_note: editVisit?.issue_note || '',
  });
  const [saving, setSaving] = useState(false);
  const [newTruck, setNewTruck] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [companySearch, setCompanySearch] = useState('');

  const filteredCompanies = logisticCompanies.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.plant_id || !form.truck_id || !form.destination) {
      alert('Please fill: Plant, Truck, and Destination');
      return;
    }

    setSaving(true);
    const payload: any = {
      visit_date: form.visit_date,
      plant_id: form.plant_id,
      truck_id: form.truck_id,
      contact_no: form.contact_no,
      destination: form.destination,
      logistic_company_id: form.logistic_company_id,
      status: form.status,
      issue_note: form.status === 'issue' ? form.issue_note : null,
    };

    if (form.time_in) {
      payload.time_in = `${form.visit_date}T${form.time_in}:00+05:30`;
    }
    if (form.time_out) {
      payload.time_out = `${form.visit_date}T${form.time_out}:00+05:30`;
    }

    const { error } = editVisit
      ? await supabase.from('truck_visits').update(payload).eq('id', editVisit.id)
      : await supabase.from('truck_visits').insert(payload);

    setSaving(false);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      onSaved();
      onClose();
    }
  };

  const addNewTruck = async () => {
    if (!newTruck.trim()) return;
    const { data, error } = await supabase.from('trucks').insert({ truck_no: newTruck.trim().toUpperCase() }).select();
    if (error) { alert('Error: ' + error.message); return; }
    setNewTruck('');
    onSaved(); // refresh
  };

  const addNewCompany = async () => {
    if (!newCompany.trim()) return;
    const { data, error } = await supabase.from('logistic_companies').insert({ name: newCompany.trim() }).select();
    if (error) { alert('Error: ' + error.message); return; }
    setNewCompany('');
    onSaved(); // refresh
  };

  const selectedTruck = trucks.find(t => t.id === form.truck_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editVisit ? 'Edit Visit' : 'New Truck Entry'}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Date</label>
            <input type="date" className="input" value={form.visit_date}
              onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
          </div>

          <div className="field">
            <label>Plant</label>
            <select className="input" value={form.plant_id}
              onChange={(e) => setForm({ ...form, plant_id: e.target.value })}>
              <option value="">Select plant</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Truck No</label>
            <div className="field-row">
              <select className="input" value={form.truck_id}
                onChange={(e) => { setForm({ ...form, truck_id: e.target.value }); const t = trucks.find(t => t.id === e.target.value); if (t?.logistic_company_id) setForm(f => ({ ...f, truck_id: e.target.value, logistic_company_id: t.logistic_company_id! })); }}>
                <option value="">Select truck</option>
                {trucks.map(t => <option key={t.id} value={t.id}>{t.truck_no}</option>)}
              </select>
              <input type="text" className="input" placeholder="Or add new truck"
                value={newTruck} onChange={(e) => setNewTruck(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNewTruck()} />
              {newTruck && <button className="btn btn-sm btn-primary" onClick={addNewTruck}>Add</button>}
            </div>
          </div>

          <div className="field">
            <label>Contact No</label>
            <input type="tel" className="input" placeholder="Driver phone"
              value={form.contact_no} onChange={(e) => setForm({ ...form, contact_no: e.target.value })} />
          </div>

          <div className="field">
            <label>Destination</label>
            <input type="text" className="input" placeholder="e.g. Mumbai Plant"
              value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </div>

          <div className="field">
            <label>Logistic Company</label>
            <div className="field-row">
              <input type="text" className="input" placeholder="Search or type new"
                value={companySearch} onChange={(e) => setCompanySearch(e.target.value)} />
              {companySearch && !filteredCompanies.find(c => c.name === companySearch) && (
                <button className="btn btn-sm btn-primary" onClick={() => { setNewCompany(companySearch); addNewCompany(); }}>Add "{companySearch}"</button>
              )}
            </div>
            <select className="input" value={form.logistic_company_id}
              onChange={(e) => setForm({ ...form, logistic_company_id: e.target.value })}>
              <option value="">Select company</option>
              {filteredCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Status</label>
            <select className="input" value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TruckStatus })}>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {form.status === 'issue' && (
            <div className="field full-width">
              <label>Issue Note</label>
              <textarea className="input" rows={2} placeholder="Describe the issue..."
                value={form.issue_note} onChange={(e) => setForm({ ...form, issue_note: e.target.value })} />
            </div>
          )}

          <div className="field">
            <label>Time In</label>
            <input type="time" className="input" value={form.time_in}
              onChange={(e) => setForm({ ...form, time_in: e.target.value })} />
          </div>

          <div className="field">
            <label>Time Out</label>
            <input type="time" className="input" value={form.time_out}
              onChange={(e) => setForm({ ...form, time_out: e.target.value })} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editVisit ? 'Update' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------ Status Badge ------------------
function StatusBadge({ status }: { status: TruckStatus }) {
  return (
    <span className="status-badge" style={{ backgroundColor: STATUS_COLORS[status] + '20', color: STATUS_COLORS[status], borderColor: STATUS_COLORS[status] + '40' }}>
      <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[status] }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ------------------ Dashboard ------------------
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [visits, setVisits] = useState<TruckVisit[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [logisticCompanies, setLogisticCompanies] = useState<LogisticCompany[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editVisit, setEditVisit] = useState<TruckVisit | null>(null);
  const [filterStatus, setFilterStatus] = useState<TruckStatus | 'all'>('all');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [visitsRes, plantsRes, companiesRes, trucksRes] = await Promise.all([
      supabase.from('truck_visits').select('*, plants(*), trucks(*), logistic_companies(*)').order('registered_at', { ascending: false }).limit(200),
      supabase.from('plants').select('*'),
      supabase.from('logistic_companies').select('*').order('name'),
      supabase.from('trucks').select('*').order('truck_no'),
    ]);
    if (visitsRes.data) setVisits(visitsRes.data as unknown as TruckVisit[]);
    if (plantsRes.data) setPlants(plantsRes.data);
    if (companiesRes.data) setLogisticCompanies(companiesRes.data);
    if (trucksRes.data) setTrucks(trucksRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredVisits = visits.filter(v => {
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    if (filterDate && v.visit_date !== filterDate) return false;
    return true;
  });

  const todayVisits = filteredVisits.filter(v => v.visit_date === new Date().toISOString().split('T')[0]);
  const loadedCount = filteredVisits.filter(v => v.status === 'loaded').length;
  const issueCount = filteredVisits.filter(v => v.status === 'issue' || v.status === 'delayed').length;
  const activeCount = filteredVisits.filter(v => !['departed', 'cancelled', 'loaded'].includes(v.status)).length;

  const closeForm = () => { setShowForm(false); setEditVisit(null); };
  const handleSaved = () => { loadData(); };

  const exportCSV = () => {
    const headers = ['Date', 'Plant', 'Truck No', 'Contact', 'Destination', 'Company', 'Status', 'Time In', 'Time Out'];
    const rows = filteredVisits.map(v => [
      v.visit_date,
      v.plants?.name || '',
      v.trucks?.truck_no || '',
      v.contact_no,
      v.destination,
      v.logistic_companies?.name || '',
      STATUS_LABELS[v.status],
      v.time_in ? new Date(v.time_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      v.time_out ? new Date(v.time_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truck-tracker-${filterDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <TruckIcon size={24} />
          <h1>Truck Tracker</h1>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary btn-sm" onClick={exportCSV} title="Download CSV">
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Truck
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <span className="stat-value">{todayVisits.length}</span>
          <span className="stat-label">Today</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{activeCount}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card stat-loaded">
          <span className="stat-value">{loadedCount}</span>
          <span className="stat-label">Loaded</span>
        </div>
        <div className="stat-card stat-issue">
          <span className="stat-value">{issueCount}</span>
          <span className="stat-label">Issues</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-row">
          <div className="filter-group">
            <Calendar size={16} />
            <input type="date" className="input input-sm" value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} /> Status <ChevronDown size={14} />
          </button>
        </div>
        {showFilters && (
          <div className="status-filter-bar">
            <button className={`status-chip ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}>All</button>
            {STATUS_ORDER.map(s => (
              <button key={s} className={`status-chip ${filterStatus === s ? 'active' : ''}`}
                style={{ '--chip-color': STATUS_COLORS[s] } as React.CSSProperties}
                onClick={() => setFilterStatus(s)}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading"><div className="spinner" /> Loading...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Plant</th>
                <th>Destination</th>
                <th>Company</th>
                <th>Status</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <TruckIcon size={48} />
                    <p>No truck entries found</p>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                      <Plus size={16} /> Add First Entry
                    </button>
                  </td>
                </tr>
              )}
              {filteredVisits.map(v => (
                <React.Fragment key={v.id}>
                  <tr className={`visit-row ${expanded === v.id ? 'expanded' : ''}`}
                    onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                    <td className="truck-cell">{v.trucks?.truck_no || '—'}</td>
                    <td>{v.plants?.code || '—'}</td>
                    <td>{v.destination}</td>
                    <td>{v.logistic_companies?.name || '—'}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td>{v.time_in ? new Date(v.time_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{v.time_out ? new Date(v.time_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setEditVisit(v); setShowForm(true); }}>
                        ✏️
                      </button>
                    </td>
                  </tr>
                  {expanded === v.id && (
                    <tr className="expand-row">
                      <td colSpan={8}>
                        <div className="expand-details">
                          <div><strong>Contact:</strong> {v.contact_no || '—'}</div>
                          <div><strong>Registered:</strong> {new Date(v.registered_at).toLocaleString('en-IN')}</div>
                          {v.issue_note && <div className="issue-note"><strong>Issue:</strong> {v.issue_note}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <EntryForm
          plants={plants}
          logisticCompanies={logisticCompanies}
          trucks={trucks}
          onClose={closeForm}
          onSaved={handleSaved}
          editVisit={editVisit}
        />
      )}
    </div>
  );
}

// ------------------ App ------------------
export default function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <AuthPage />;
  }

  return <Dashboard onLogout={() => supabase.auth.signOut()} />;
}