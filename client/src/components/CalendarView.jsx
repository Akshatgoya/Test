import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, PauseCircle, Clock, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatDateDisplay } from '../utils/formatters.js';

export default function CalendarView({
  customer,
  onClose,
  onFetchBill,
  currency = '₹'
}) {
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await onFetchBill(customer.id, 2026, 9);
        setCalendarData(data);
      } catch (err) {
        console.error('Failed to load calendar data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customer.id]);

  const days = calendarData?.calendarDays || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h3>Delivery Calendar — {calendarData?.monthName || 'September 2026'}</h3>
            <p>
              Customer: <strong>{customer.name}</strong> ({customer.phone})
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Quick Legend */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="dot-indicator dot-green"></span>
              🟢 Delivered ({calendarData?.actualDeliveredSoFarCount || 0})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="dot-indicator dot-orange"></span>
              🟠 Paused ({calendarData?.pausedWeekdaysCount || 0})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }}></span>
              🔵 Upcoming Scheduled ({calendarData?.upcomingActiveCount || 0})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--neutral-400)' }}>
              ⚪ Weekend (Rest)
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
              Loading delivery calendar...
            </div>
          ) : (
            <div>
              {/* 7-column header */}
              <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="cal-header">{d}</div>
                ))}

                {/* Day cells */}
                {days.map((day) => {
                  let cls = 'cal-day';
                  if (day.status === 'delivered') cls += ' delivered';
                  else if (day.status === 'paused') cls += ' paused';
                  else if (day.status === 'upcoming_active') cls += ' upcoming-active';
                  else if (day.status === 'upcoming_paused') cls += ' upcoming-paused';
                  else if (day.status === 'weekend') cls += ' weekend';

                  if (day.isToday) cls += ' today-marker';

                  return (
                    <div
                      key={day.date}
                      className={cls}
                      onClick={() => setSelectedDay(day)}
                      style={{ cursor: 'pointer' }}
                      title={`${day.date}: ${day.label}`}
                    >
                      <span style={{ fontSize: '0.9rem' }}>{day.dayNumber}</span>
                      {day.status === 'delivered' && (
                        <span style={{ fontSize: '0.65rem', color: '#047857', fontWeight: 700 }}>Lunch</span>
                      )}
                      {day.status === 'paused' && (
                        <span style={{ fontSize: '0.6rem', color: '#C2410C', fontWeight: 700 }}>Paused</span>
                      )}
                      {day.status === 'upcoming_active' && (
                        <span style={{ fontSize: '0.6rem', color: '#1D4ED8' }}>Active</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Info */}
              {selectedDay && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h5 style={{ fontSize: '0.9rem', color: 'var(--neutral-900)' }}>
                      {formatDateDisplay(selectedDay.date)} ({selectedDay.dayOfWeek})
                    </h5>
                    <p style={{ fontSize: '0.825rem', color: 'var(--neutral-600)' }}>
                      Status: <strong>{selectedDay.label}</strong>
                    </p>
                  </div>
                  {selectedDay.status === 'paused' && (
                    <span className="status-badge paused">
                      Skipped (₹0 charged)
                    </span>
                  )}
                  {selectedDay.status === 'delivered' && (
                    <span className="status-badge active">
                      Lunch Served
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
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
