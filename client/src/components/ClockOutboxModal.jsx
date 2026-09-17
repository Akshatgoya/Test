import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { api } from '../utils/api.js';

export default function ClockOutboxModal({ isOpen, onClose, onDateChanged }) {
  const [currentDate, setCurrentDate] = useState('2026-09-17');
  const [selectedDate, setSelectedDate] = useState('2026-09-17');
  const [outbox, setOutbox] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadClockAndOutbox();
    }
  }, [isOpen]);

  const loadClockAndOutbox = async () => {
    try {
      setLoading(true);
      const clockData = await api.getClock();
      if (clockData.currentDate) {
        setCurrentDate(clockData.currentDate);
        setSelectedDate(clockData.currentDate);
      }
      const outboxData = await api.getOutbox();
      setOutbox(Array.isArray(outboxData) ? outboxData : []);
    } catch (err) {
      console.error('Failed to load clock or outbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceOneDay = async () => {
    try {
      setAdvancing(true);
      const res = await api.advanceClock({ advanceDays: 1 });
      setCurrentDate(res.date);
      setSelectedDate(res.date);
      setStatusMessage({
        type: 'success',
        text: `🌅 Clock advanced to ${res.date}! Dispatched ${res.dispatchedCount} morning delivery notifications.`
      });
      const updatedOutbox = await api.getOutbox();
      setOutbox(updatedOutbox);
      if (onDateChanged) onDateChanged(res.date);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setAdvancing(false);
    }
  };

  const handleSetCustomDate = async (targetDate) => {
    try {
      setAdvancing(true);
      const res = await api.advanceClock({ date: targetDate });
      setCurrentDate(res.date);
      setSelectedDate(res.date);
      if (res.isWeekday) {
        setStatusMessage({
          type: 'success',
          text: `🌅 Clock set to ${res.date} (Weekday). Dispatched ${res.dispatchedCount} morning delivery notifications.`
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: `📅 Clock set to ${res.date} (Weekend). 0 notifications dispatched (Kitchen closed on weekends).`
        });
      }
      const updatedOutbox = await api.getOutbox();
      setOutbox(updatedOutbox);
      if (onDateChanged) onDateChanged(res.date);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setAdvancing(false);
    }
  };

  const handleClearOutbox = async () => {
    if (!window.confirm('Are you sure you want to clear all messages in the notification outbox?')) {
      return;
    }
    try {
      await api.clearOutbox();
      setOutbox([]);
      setStatusMessage({ type: 'success', text: 'Outbox cleared successfully.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  if (!isOpen) return null;

  // Filter messages
  const filteredMessages = outbox.filter(msg => {
    if (filterType !== 'all' && msg.date !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (msg.customerName && msg.customerName.toLowerCase().includes(q)) ||
        (msg.phone && msg.phone.includes(q)) ||
        (msg.message && msg.message.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const uniqueDates = Array.from(new Set(outbox.map(m => m.date)));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-extra-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-icon">⏰</span>
            <div>
              <h2>System Clock & Morning Notification Outbox</h2>
              <p className="modal-subtitle">
                Level 1 Twist: Morning clock triggers automatic notifications to all active, non-paused weekday subscribers.
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {statusMessage && (
            <div className={`alert-banner ${statusMessage.type === 'error' ? 'alert-error' : (statusMessage.type === 'info' ? 'alert-info' : 'alert-success')}`}>
              <span>{statusMessage.text}</span>
              <button className="alert-close" onClick={() => setStatusMessage(null)}>&times;</button>
            </div>
          )}


        <div className="clock-dashboard">
          {/* Clock Control Panel */}
          <div className="clock-control-card">
            <div className="clock-live-indicator">
              <span className="live-dot pulse"></span>
              <span className="clock-label">CURRENT SYSTEM TIME</span>
            </div>
            <div className="clock-display-date">
              {currentDate}
            </div>
            <p className="clock-info-text">
              Each morning at 08:00 AM, the delivery engine queries active weekday subscriptions and queues SMS reminders.
            </p>

            <div className="clock-actions-row">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAdvanceOneDay}
                disabled={advancing}
              >
                {advancing ? 'Advancing Clock...' : '🌅 Advance +1 Morning Day'}
              </button>
            </div>

            <div className="clock-presets">
              <span className="presets-title">Quick Test Jump:</span>
              <div className="preset-buttons">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleSetCustomDate('2026-09-01')}
                  disabled={advancing}
                >
                  Sep 1 (Cycle Start)
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleSetCustomDate('2026-09-06')}
                  disabled={advancing}
                >
                  Sep 6 (Weekend - 0 Notif)
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleSetCustomDate('2026-09-15')}
                  disabled={advancing}
                >
                  Sep 15 (Mid-Month)
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleSetCustomDate('2026-09-30')}
                  disabled={advancing}
                >
                  Sep 30 (Month End)
                </button>
              </div>
            </div>

            <div className="clock-custom-jump">
              <label>Custom Date Picker:</label>
              <div className="date-input-group">
                <input
                  type="date"
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => handleSetCustomDate(selectedDate)}
                  disabled={advancing || !selectedDate}
                >
                  Jump to Date
                </button>
              </div>
            </div>
          </div>

          {/* Outbox Feed */}
          <div className="outbox-feed-card">
            <div className="outbox-feed-header">
              <div>
                <h3>Notification Outbox</h3>
                <span className="outbox-badge">
                  {outbox.length} {outbox.length === 1 ? 'Message' : 'Messages'} Logged
                </span>
              </div>
              {outbox.length > 0 && (
                <button className="btn btn-sm btn-danger-outline" onClick={handleClearOutbox}>
                  🗑️ Clear Outbox
                </button>
              )}
            </div>

            {/* Filter controls */}
            <div className="outbox-filter-bar">
              <input
                type="text"
                className="input-field search-input"
                placeholder="Search recipient or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="input-field date-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Dates ({outbox.length})</option>
                {uniqueDates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Message List */}
            <div className="outbox-list">
              {loading ? (
                <div className="loading-state">Loading outbox records...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>No messages in outbox for this selection.</p>
                  <span className="empty-hint">Advance the clock to a weekday to trigger morning notifications.</span>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div key={msg.id} className="outbox-message-item">
                    <div className="msg-top-row">
                      <div className="msg-recipient">
                        <span className="msg-avatar">📱</span>
                        <div>
                          <strong>{msg.customerName}</strong>
                          <span className="msg-phone">{msg.phone}</span>
                        </div>
                      </div>
                      <div className="msg-meta">
                        <span className="badge badge-success">Delivered (SMS)</span>
                        <span className="msg-date">{msg.date}</span>
                      </div>
                    </div>
                    <div className="msg-bubble">
                      <p>{msg.message}</p>
                    </div>
                    <div className="msg-footer">
                      <span>Plan: <strong>{msg.planName}</strong></span>
                      <span>Slot: <strong>{msg.deliverySlot}</strong></span>
                      <span className="msg-id">ID: {msg.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

