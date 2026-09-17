import React from 'react';
import { Utensils, PauseCircle, Users, Receipt, PiggyBank } from 'lucide-react';
import { formatCurrency } from '../utils/formatters.js';

export default function StatsOverview({
  activeTodayCount,
  pausedTodayCount,
  totalSubscribers,
  monthSummary,
  currency = '₹'
}) {
  return (
    <div className="stats-grid">
      {/* Active Today */}
      <div className="stat-card">
        <div className="stat-info">
          <p>Deliver Today</p>
          <h2>{activeTodayCount} Meals</h2>
          <span>Pack in kitchen today</span>
        </div>
        <div className="stat-icon active">
          <Utensils size={24} />
        </div>
      </div>

      {/* Paused Today */}
      <div className="stat-card">
        <div className="stat-info">
          <p>Paused Today</p>
          <h2>{pausedTodayCount} Skipped</h2>
          <span>Zero charge today</span>
        </div>
        <div className="stat-icon paused">
          <PauseCircle size={24} />
        </div>
      </div>

      {/* Total Subscribers */}
      <div className="stat-card">
        <div className="stat-info">
          <p>Total Subscribers</p>
          <h2>{totalSubscribers}</h2>
          <span>Active monthly accounts</span>
        </div>
        <div className="stat-icon money">
          <Users size={24} />
        </div>
      </div>

      {/* Pro-Rated Billed Revenue */}
      <div className="stat-card">
        <div className="stat-info">
          <p>Month Pro-Rated Bill</p>
          <h2>{formatCurrency(monthSummary?.totalActualProRatedBilled || 0, currency)}</h2>
          <span>{monthSummary?.totalDeliveredDays || 0} meals served this month</span>
        </div>
        <div className="stat-icon money">
          <Receipt size={24} />
        </div>
      </div>

      {/* Total Customer Savings */}
      <div className="stat-card">
        <div className="stat-info">
          <p>Fair Customer Savings</p>
          <h2>{formatCurrency(monthSummary?.totalCustomerSavings || 0, currency)}</h2>
          <span>{monthSummary?.totalPausedDays || 0} paused days deducted</span>
        </div>
        <div className="stat-icon savings">
          <PiggyBank size={24} />
        </div>
      </div>
    </div>
  );
}
