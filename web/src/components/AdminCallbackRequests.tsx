import { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Search,
  RefreshCw,
  Eye,
  Check,
  X,
  Clock,
  PhoneIncoming,
  PhoneOff,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Calendar,
  User,
  Mail,
  Phone,
  Building2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { request } from '../lib/api/httpClient';
import type { ApiResponse } from '../lib/api/types';

interface CallbackRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  collegeUniversity?: string;
  programInterest?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Statistics {
  total: number;
  pending: number;
  inProgress: number;
  contacted: number;
  closed: number;
  todayCount: number;
  thisWeekCount: number;
}

type StatusKey = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Closed';

type CallbackRequestsResponse = ApiResponse<CallbackRequest[]> & {
  pagination: { totalPages: number; totalCount: number };
  statistics: Statistics;
};

const STATUS_CONFIG: Record<StatusKey, { bg: string; text: string; border: string; icon: React.ComponentType<{ size?: number }> }> = {
  New:       { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', icon: Clock },
  Qualified: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', icon: PhoneIncoming },
  Contacted: { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', icon: Check },
  Converted: { bg: '#F0FDF4', text: '#14532D', border: '#86EFAC', icon: Sparkles },
  Closed:    { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB', icon: PhoneOff },
};

const STATUS_OPTIONS: StatusKey[] = ['New', 'Qualified', 'Contacted', 'Converted', 'Closed'];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? STATUS_CONFIG.New;
  const Icon = cfg.icon;
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.text,
      border: `1px solid ${cfg.border}`,
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      whiteSpace: 'nowrap',
    }}>
      <Icon size={13} />
      {status}
    </span>
  );
}

export function AdminCallbackRequests({ onMessage }: { onMessage: (msg: string, tone?: 'success' | 'error') => void }) {
  const [requests, setRequests] = useState<CallbackRequest[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CallbackRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '15',
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await request<CallbackRequest[]>(
        `/api/v1/callbackrequests?${params.toString()}`,
      ) as CallbackRequestsResponse;

      setRequests(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.totalCount);
      setStatistics(res.statistics);
    } catch {
      onMessage('Failed to load callback requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, onMessage]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  // reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statusFilter, searchQuery]);

  const openModal = (req: CallbackRequest) => {
    setSelectedRequest(req);
    setAdminNotes(req.adminNotes ?? '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedRequest) return;
    try {
      setSaving(true);
      await request(`/api/v1/callbackrequests/${selectedRequest.id}`, {
        method: 'PATCH',
        body: { status: newStatus, adminNotes },
      });
      onMessage(`Marked as "${newStatus}"`);
      closeModal();
      loadRequests();
    } catch {
      onMessage('Failed to update status', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    try {
      setSaving(true);
      await request(`/api/v1/callbackrequests/${selectedRequest.id}`, {
        method: 'PATCH',
        body: { adminNotes },
      });
      onMessage('Notes saved');
      closeModal();
      loadRequests();
    } catch {
      onMessage('Failed to save notes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

  const statCards = [
    { label: 'Total',     value: statistics?.total,      color: '#6366F1', icon: PhoneCall },
    { label: 'New',       value: statistics?.pending,    color: '#F59E0B', icon: Clock },
    { label: 'Qualified', value: statistics?.inProgress, color: '#3B82F6', icon: PhoneIncoming },
    { label: 'Contacted', value: statistics?.contacted,  color: '#10B981', icon: Check },
    { label: 'Today',     value: statistics?.todayCount, color: '#8B5CF6', icon: Calendar },
    { label: 'This Week', value: statistics?.thisWeekCount, color: '#EC4899', icon: Sparkles },
  ];

  return (
    <div className="admin-module" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 700, color: '#111827' }}>
            <PhoneCall size={24} color="#6366F1" />
            Callback Requests
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>
            {totalCount} total request{totalCount !== 1 ? 's' : ''} — review and follow up
          </p>
        </div>
        <button
          onClick={loadRequests}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#F3F4F6', border: '1px solid #E5E7EB',
            borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151',
          }}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{
            background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12,
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 4px rgba(0,0,0,.05)',
          }}>
            <span style={{ background: color + '18', borderRadius: 10, padding: 8, display: 'flex' }}>
              <Icon size={20} color={color} />
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#111827' }}>
                {value ?? '—'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
          padding: '8px 12px',
        }}>
          <Search size={16} color="#9CA3AF" />
          <input
            type="search"
            placeholder="Search name, email, phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
            fontSize: 14, background: '#fff', cursor: 'pointer', color: '#374151',
          }}
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <PhoneCall size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, color: '#6B7280', fontWeight: 600 }}>No requests found</p>
            <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: 13 }}>Try changing the filters</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                  {['Name', 'Contact', 'College / University', 'Program', 'Status', 'Submitted', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, i) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #F9FAFB', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ background: '#EEF2FF', borderRadius: 8, padding: 6, display: 'flex' }}>
                          <User size={16} color="#6366F1" />
                        </span>
                        <strong style={{ color: '#111827' }}>{req.fullName}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Mail size={13} /> {req.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={13} /> {req.phone}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: req.collegeUniversity ? '#374151' : '#D1D5DB', fontSize: 13 }}>
                      {req.collegeUniversity
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Building2 size={13} />{req.collegeUniversity}</span>
                        : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {req.programInterest
                        ? <span style={{ background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <BookOpen size={13} />{req.programInterest}
                          </span>
                        : <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={req.status} />
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {fmt(req.createdAt)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => openModal(req)}
                        style={{
                          background: '#EEF2FF', color: '#4F46E5', border: 'none',
                          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <Eye size={15} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#fff', opacity: page === 1 ? .4 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: page === totalPages ? 'not-allowed' : 'pointer', background: '#fff', opacity: page === totalPages ? .4 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Detail modal ── */}
      {showModal && selectedRequest && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16, backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, maxWidth: 640, width: '100%',
              maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PhoneCall size={20} color="#6366F1" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Request Details</h2>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF' }}>
                <X size={22} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px' }}>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { icon: User,      label: 'Full Name',    value: selectedRequest.fullName },
                  { icon: Mail,      label: 'Email',        value: selectedRequest.email },
                  { icon: Phone,     label: 'Phone',        value: selectedRequest.phone },
                  { icon: Building2, label: 'College',      value: selectedRequest.collegeUniversity ?? '—' },
                  { icon: BookOpen,  label: 'Program',      value: selectedRequest.programInterest ?? '—' },
                  { icon: Calendar,  label: 'Submitted',    value: fmt(selectedRequest.createdAt) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ background: '#F9FAFB', padding: 8, borderRadius: 8, display: 'flex', flexShrink: 0, marginTop: 2 }}>
                      <Icon size={16} color="#6B7280" />
                    </span>
                    <div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</div>
                      <div style={{ fontSize: 14, color: '#111827', marginTop: 2, fontWeight: 500 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current status */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>CURRENT STATUS</div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              {/* Admin notes */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MessageSquare size={15} /> Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Add internal notes about this request…"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                    border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14,
                    fontFamily: 'inherit', resize: 'vertical', color: '#111827',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Update status */}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>CHANGE STATUS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {STATUS_OPTIONS.filter(s => s !== selectedRequest.status).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={s}
                        disabled={saving}
                        onClick={() => handleUpdateStatus(s)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', border: `1px solid ${cfg.border}`,
                          background: cfg.bg, color: cfg.text, borderRadius: 8,
                          fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? .5 : 1, transition: 'all .2s',
                        }}
                      >
                        <Icon size={14} /> {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={closeModal}
                style={{ padding: '8px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                style={{
                  padding: '8px 18px', border: 'none', borderRadius: 8,
                  background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
                  opacity: saving ? .6 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
