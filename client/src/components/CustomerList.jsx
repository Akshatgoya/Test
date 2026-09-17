import React from 'react';
import { 
  Phone, 
  MapPin, 
  Calendar, 
  Receipt, 
  PauseCircle, 
  PlayCircle, 
  Clock, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function CustomerList({
  customers,
  statusFilter,
  setStatusFilter,
  onOpenPause,
  onOpenBill,
  onOpenCalendar,
  onDeleteCustomer,
  currency = '₹',
  searchQuery
}) {
  const getDietClass = (diet) => {
    switch (diet?.toLowerCase()) {
      case 'jain': return 'diet-jain';
      case 'non-veg': return 'diet-nonveg';
      default: return 'diet-veg';
    }
  };

  const getStatusBadge = (statusObj) => {
    if (!statusObj) return null;

    if (statusObj.status === 'active') {
      return (
        <span className="status-badge active" title="Scheduled to deliver lunch today">
          <span className="dot-indicator dot-green"></span>
          Active Today
        </span>
      );
    }

    if (statusObj.status === 'paused') {
      return (
        <span className="status-badge paused" title={statusObj.reason || 'Paused'}>
          <span className="dot-indicator dot-orange"></span>
          Paused Today
        </span>
      );
    }

    if (statusObj.status === 'weekend') {
      return (
        <span className="status-badge weekend" title="Saturday/Sunday - Non-delivery day">
          Weekend Rest
        </span>
      );
    }

    return (
      <span className="status-badge weekend">
        {statusObj.label || 'Inactive'}
      </span>
    );
  };

  return (
    <div className="table-card">
      {/* Action Bar / Status Filters */}
      <div className="action-bar">
        <div className="status-filters">
          <button
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
            id="filter-all"
          >
            All Customers ({customers.length})
          </button>
          <button
            className={`filter-chip ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
            id="filter-active"
          >
            <span className="dot-indicator dot-green"></span>
            Active Today
          </button>
          <button
            className={`filter-chip ${statusFilter === 'paused' ? 'active' : ''}`}
            onClick={() => setStatusFilter('paused')}
            id="filter-paused"
          >
            <span className="dot-indicator dot-orange"></span>
            Paused Today
          </button>
        </div>

        {searchQuery && (
          <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
            Showing results matching <strong>"{searchQuery}"</strong>
          </div>
        )}
      </div>

      {customers.length === 0 ? (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--neutral-500)' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 0.75rem auto', color: 'var(--neutral-400)' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--neutral-800)', marginBottom: '0.25rem' }}>No subscribers found</h3>
          <p style={{ fontSize: '0.875rem' }}>
            {searchQuery ? `No customer found with phone or name "${searchQuery}".` : 'No customers match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer & Address</th>
                <th>Phone Lookup</th>
                <th>Subscribed Plan</th>
                <th>Today's Status</th>
                <th>Active Pauses</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => {
                const isPausedToday = cust.todayStatus?.status === 'paused';
                const pauseCount = cust.pauses?.length || 0;

                return (
                  <tr key={cust.id} id={`customer-row-${cust.id}`}>
                    {/* Customer Info */}
                    <td>
                      <div className="cust-cell">
                        <div className="cust-name">
                          <span>{cust.name}</span>
                          <span className={`diet-pill ${getDietClass(cust.dietary)}`}>
                            {cust.dietary || 'Veg'}
                          </span>
                        </div>
                        <div className="cust-address" title={cust.address}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: 3 }} />
                          {cust.address}
                        </div>
                      </div>
                    </td>

                    {/* Phone Number (Primary lookup) */}
                    <td>
                      <a
                        href={`tel:${cust.phone}`}
                        className="cust-phone"
                        style={{ textDecoration: 'none', color: 'var(--neutral-800)', fontWeight: 600 }}
                        title="Click to call"
                      >
                        <Phone size={14} style={{ color: 'var(--primary)' }} />
                        <span>{cust.phone}</span>
                      </a>
                      <div style={{ fontSize: '0.725rem', color: 'var(--neutral-400)', marginTop: '2px' }}>
                        Slot: {cust.deliverySlot || '12:30 PM'}
                      </div>
                    </td>

                    {/* Plan */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                        {cust.planName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                        {formatCurrency(cust.planMonthlyPrice, currency)}/month
                      </div>
                    </td>

                    {/* Today's Status */}
                    <td>
                      {getStatusBadge(cust.todayStatus)}
                      {cust.todayStatus?.reason && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--paused-dark)', marginTop: '3px' }}>
                          {cust.todayStatus.reason}
                        </div>
                      )}
                    </td>

                    {/* Active Pauses */}
                    <td>
                      {pauseCount > 0 ? (
                        <span 
                          style={{ 
                            fontSize: '0.775rem', 
                            padding: '0.2rem 0.5rem', 
                            background: 'var(--paused-light)', 
                            color: 'var(--paused-dark)', 
                            borderRadius: '4px',
                            fontWeight: 600 
                          }}
                        >
                          {pauseCount} {pauseCount === 1 ? 'Pause record' : 'Pause records'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.775rem', color: 'var(--neutral-400)' }}>
                          No upcoming pauses
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {/* Pause / Resume Button */}
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          onClick={() => onOpenPause(cust)}
                          title="Manage Pauses / Skip days"
                          id={`btn-pause-${cust.id}`}
                        >
                          <PauseCircle size={15} style={{ color: 'var(--paused-orange)' }} />
                          <span>Pause / Resume</span>
                        </button>

                        {/* View Pro-Rated Bill Button */}
                        <button
                          className="btn-outline-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          onClick={() => onOpenBill(cust)}
                          title="View Pro-Rated Month-End Bill & Invoice"
                          id={`btn-bill-${cust.id}`}
                        >
                          <Receipt size={15} />
                          <span>Bill & Invoice</span>
                        </button>

                        {/* Calendar View Button */}
                        <button
                          className="btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => onOpenCalendar(cust)}
                          title="View Month Calendar"
                          id={`btn-calendar-${cust.id}`}
                        >
                          <CalendarDays size={15} />
                        </button>

                        {/* Delete Customer */}
                        <button
                          className="btn-icon"
                          style={{ width: '32px', height: '32px', color: '#EF4444' }}
                          onClick={() => onDeleteCustomer(cust)}
                          title="Cancel Subscription"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
