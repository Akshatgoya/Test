import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Trash2, ShieldCheck, Clock, PlayCircle } from 'lucide-react';
import { formatCurrency, formatDateDisplay } from '../utils/formatters.js';

export default function PauseModal({
  customer,
  onClose,
  onAddPause,
  onResumePause,
  currency = '₹'
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('Travel / Out of town');
  const [customReason, setCustomReason] = useState('');
  const [previewSavings, setPreviewSavings] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default dates on open
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    setStartDate(todayStr);
    setEndDate(todayStr);
  }, []);

  // Calculate live pro-rata savings whenever start/end dates change
  useEffect(() => {
    if (!startDate || !endDate || startDate > endDate) {
      setPreviewSavings(null);
      return;
    }

    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    let weekdaysCount = 0;
    let weekendCount = 0;
    const curr = new Date(start);

    while (curr <= end) {
      const day = curr.getDay();
      if (day >= 1 && day <= 5) {
        weekdaysCount++;
      } else {
        weekendCount++;
      }
      curr.setDate(curr.getDate() + 1);
    }

    // Estimate daily rate (assuming standard ~22 weekdays)
    const monthlyPrice = Number(customer?.planMonthlyPrice || 2800);
    const estimatedDailyRate = monthlyPrice / 22;
    const estimatedSavings = Math.round(weekdaysCount * estimatedDailyRate);

    setPreviewSavings({
      weekdaysCount,
      weekendCount,
      estimatedSavings,
      dailyRate: Math.round(estimatedDailyRate)
    });
  }, [startDate, endDate, customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setIsSubmitting(true);
    const selectedReason = reason === 'Other' ? (customReason || 'Personal reasons') : reason;

    try {
      await onAddPause(customer.id, {
        startDate,
        endDate,
        reason: selectedReason
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to schedule pause');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreset = (type) => {
    const today = new Date();
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    if (type === 'today') {
      const s = formatDate(today);
      setStartDate(s);
      setEndDate(s);
    } else if (type === 'tomorrow') {
      const tmrw = new Date(today);
      tmrw.setDate(tmrw.getDate() + 1);
      const s = formatDate(tmrw);
      setStartDate(s);
      setEndDate(s);
    } else if (type === '3days') {
      const s = formatDate(today);
      const end = new Date(today);
      end.setDate(end.getDate() + 2);
      setStartDate(s);
      setEndDate(formatDate(end));
    } else if (type === 'nextweek') {
      // Next Monday to Friday
      const nextMon = new Date(today);
      const day = today.getDay();
      const daysUntilMon = (8 - day) % 7 || 7;
      nextMon.setDate(today.getDate() + daysUntilMon);

      const nextFri = new Date(nextMon);
      nextFri.setDate(nextMon.getDate() + 4);

      setStartDate(formatDate(nextMon));
      setEndDate(formatDate(nextFri));
    }
  };

  const pauses = customer?.pauses || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>Pause / Resume Subscription</h3>
            <p>
              Customer: <strong>{customer?.name}</strong> ({customer?.phone}) • Plan: {customer?.planName}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Schedule a new pause */}
          <form onSubmit={handleSubmit} id="pause-form">
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--neutral-800)' }}>
              Schedule a New Delivery Pause
            </h4>

            {/* Quick presets */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="filter-chip"
                onClick={() => handlePreset('today')}
              >
                Pause Today
              </button>
              <button
                type="button"
                className="filter-chip"
                onClick={() => handlePreset('tomorrow')}
              >
                Pause Tomorrow
              </button>
              <button
                type="button"
                className="filter-chip"
                onClick={() => handlePreset('3days')}
              >
                Next 3 Days
              </button>
              <button
                type="button"
                className="filter-chip"
                onClick={() => handlePreset('nextweek')}
              >
                Full Next Week (Mon-Fri)
              </button>
            </div>

            {/* Date Pickers */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Pause Start Date (Inclusive)</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  id="pause-start-date"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pause End Date (Inclusive)</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  id="pause-end-date"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reason for Pause</label>
                <select
                  className="form-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  id="pause-reason-select"
                >
                  <option value="Travel / Out of town">Travel / Out of town</option>
                  <option value="Festival / Puja Celebration">Festival / Puja Celebration</option>
                  <option value="Fasting / Vrat">Fasting / Vrat</option>
                  <option value="Work from Home / Office shift">Work from Home / Office shift</option>
                  <option value="Illness / Medical Leave">Illness / Medical Leave</option>
                  <option value="Family Function">Family Function</option>
                  <option value="Other">Other (Type custom reason)</option>
                </select>
              </div>

              {reason === 'Other' && (
                <div className="form-group">
                  <label className="form-label">Specify Custom Reason</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Renovation, Dietary fast..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* Pro-Rata Savings Live Preview */}
            {previewSavings && (
              <div className="savings-callout">
                <div>
                  <h4>
                    {previewSavings.weekdaysCount} Delivery {previewSavings.weekdaysCount === 1 ? 'Day' : 'Days'} Paused
                  </h4>
                  <p>
                    {previewSavings.weekendCount > 0 && (
                      <span>({previewSavings.weekendCount} weekend rest days automatically excluded) • </span>
                    )}
                    Customer will not be billed for these dates.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#92400E', textTransform: 'uppercase', fontWeight: 700 }}>
                    Instant Bill Deduction
                  </span>
                  <div className="savings-amount">
                    -{formatCurrency(previewSavings.estimatedSavings, currency)}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
              disabled={isSubmitting || !previewSavings || previewSavings.weekdaysCount === 0}
              id="btn-confirm-pause"
            >
              <Calendar size={18} />
              <span>Confirm & Save Delivery Pause</span>
            </button>
          </form>

          {/* Active / Scheduled Pauses List */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--neutral-200)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--neutral-800)' }}>
              Current Scheduled Pauses ({pauses.length})
            </h4>

            {pauses.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>
                No active or upcoming pauses. Customer is receiving deliveries on all scheduled weekdays.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pauses.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--neutral-50)',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--neutral-900)', fontSize: '0.9rem' }}>
                        {formatDateDisplay(p.startDate)} → {formatDateDisplay(p.endDate)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--paused-dark)', marginTop: '2px' }}>
                        Reason: <strong>{p.reason}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#047857' }}
                      onClick={() => onResumePause(customer.id, p.id)}
                      title="Resume deliveries early (cancels this pause)"
                      id={`btn-resume-${p.id}`}
                    >
                      <PlayCircle size={15} style={{ color: '#10B981' }} />
                      <span>Resume Early</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
