import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Utensils, 
  Phone, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  PauseCircle,
  Calendar
} from 'lucide-react';
import { formatDateDisplay } from '../utils/formatters.js';

export default function DispatchSheet({ onFetchDispatch, currency = '₹' }) {
  const [dispatchData, setDispatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const loadData = async (date) => {
    setLoading(true);
    try {
      const data = await onFetchDispatch(date);
      setDispatchData(data);
    } catch (err) {
      console.error('Failed to load dispatch sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="action-bar" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--neutral-900)' }}>
            Kitchen Packing & Dispatch Manifest
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} style={{ color: 'var(--neutral-500)' }} />
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              id="dispatch-date-picker"
            />
          </div>
        </div>

        <button
          className="btn-secondary"
          onClick={handlePrint}
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          id="btn-print-dispatch"
        >
          <Printer size={16} />
          <span>Print Packing Sheet</span>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
          Loading dispatch manifest...
        </div>
      ) : !dispatchData ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
          Could not load dispatch data.
        </div>
      ) : (
        <div id="printable-dispatch">
          {/* Summary Pills */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                TOTAL MEALS TO PACK
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#065F46', marginTop: '2px' }}>
                {dispatchData.totalToPack} Dabbas
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                Deliveries for {formatDateDisplay(selectedDate)}
              </span>
            </div>

            <div style={{
              background: '#FFF7ED',
              border: '1px solid #FFEDD5',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>
                PAUSED TODAY (DO NOT PACK)
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#9A3412', marginTop: '2px' }}>
                {dispatchData.totalPaused} Skipped
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#C2410C' }}>
                Paused by customers
              </span>
            </div>

            {/* Diet counts */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                DIETARY BREAKDOWN
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span className="diet-pill diet-veg">
                  Pure Veg: {dispatchData.dietaryCounts['Pure Veg'] || 0}
                </span>
                <span className="diet-pill diet-jain">
                  Jain: {dispatchData.dietaryCounts['Jain'] || 0}
                </span>
                <span className="diet-pill diet-nonveg">
                  Non-Veg: {dispatchData.dietaryCounts['Non-Veg'] || 0}
                </span>
              </div>
            </div>
          </div>

          {dispatchData.isWeekend && (
            <div style={{
              padding: '1rem',
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#92400E'
            }}>
              <AlertTriangle size={20} />
              <div>
                <strong>Weekend Notice:</strong> {formatDateDisplay(selectedDate)} is a Saturday/Sunday.
                Standard tiffin delivery operates on weekdays (Mon-Fri).
              </div>
            </div>
          )}

          {/* Section 1: Active Meals to Deliver */}
          <div className="table-card" style={{ marginBottom: '2rem' }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--neutral-200)',
              background: 'var(--neutral-50)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--neutral-900)' }}>
                ✅ Active Delivery Manifest ({dispatchData.activeList.length})
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                Pack & dispatch these lunchboxes
              </span>
            </div>

            {dispatchData.activeList.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
                No active deliveries scheduled for this date.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Customer & Contact</th>
                      <th>Plan & Diet</th>
                      <th>Delivery Slot</th>
                      <th>Drop Address & Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchData.activeList.map((c, i) => (
                      <tr key={c.id}>
                        <td>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={12} style={{ color: 'var(--primary)' }} />
                            <span>{c.phone}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.planName}</div>
                          <span className={`diet-pill ${c.dietary?.toLowerCase() === 'jain' ? 'diet-jain' : c.dietary?.toLowerCase() === 'non-veg' ? 'diet-nonveg' : 'diet-veg'}`}>
                            {c.dietary}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--neutral-700)', fontWeight: 600 }}>
                            <Clock size={13} style={{ color: 'var(--neutral-400)' }} />
                            <span>{c.deliverySlot || '12:30 PM'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: 'var(--neutral-800)' }}>
                            <MapPin size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--neutral-400)' }} />
                            {c.address}
                          </div>
                          {c.notes && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#92400E', 
                              background: '#FEF3C7', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginTop: '3px' 
                            }}>
                              Note: {c.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Paused Customers (Do NOT Pack) */}
          <div className="table-card">
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--neutral-200)',
              background: '#FFF7ED',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h4 style={{ fontSize: '1rem', color: '#9A3412' }}>
                ⏸️ Paused Customers ({dispatchData.pausedList.length}) — DO NOT PACK
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#C2410C' }}>
                Zero charge • Skipped by customer
              </span>
            </div>

            {dispatchData.pausedList.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
                No customers are on pause for this date.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Phone Number</th>
                      <th>Regular Plan</th>
                      <th>Pause Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatchData.pausedList.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700 }}>{c.name}</td>
                        <td>{c.phone}</td>
                        <td>{c.planName}</td>
                        <td>
                          <span className="status-badge paused">
                            {c.todayStatus?.reason || 'Pause scheduled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
