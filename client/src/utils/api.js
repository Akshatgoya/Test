const BASE_URL = '/api';

export const api = {
  // Config
  getConfig: async () => {
    const res = await fetch(`${BASE_URL}/config`);
    if (!res.ok) throw new Error('Failed to load config');
    return res.json();
  },

  updateConfig: async (data) => {
    const res = await fetch(`${BASE_URL}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update config');
    return res.json();
  },

  // Plans
  getPlans: async () => {
    const res = await fetch(`${BASE_URL}/plans`);
    if (!res.ok) throw new Error('Failed to load meal plans');
    return res.json();
  },

  createPlan: async (planData) => {
    const res = await fetch(`${BASE_URL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    if (!res.ok) throw new Error('Failed to create meal plan');
    return res.json();
  },

  // Customers
  getCustomers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.date) query.append('date', params.date);

    const res = await fetch(`${BASE_URL}/customers?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  getCustomerById: async (id, date = null) => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/customers/${id}${query}`);
    if (!res.ok) throw new Error('Failed to fetch customer details');
    return res.json();
  },

  createCustomer: async (customerData) => {
    const res = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create customer');
    }
    return res.json();
  },

  updateCustomer: async (id, data) => {
    const res = await fetch(`${BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update customer');
    return res.json();
  },

  deleteCustomer: async (id) => {
    const res = await fetch(`${BASE_URL}/customers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete customer');
    return res.json();
  },

  // Pause & Resume
  addPause: async (customerId, pauseData) => {
    const res = await fetch(`${BASE_URL}/customers/${customerId}/pause`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pauseData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to schedule pause');
    }
    return res.json();
  },

  removePause: async (customerId, pauseId) => {
    const res = await fetch(`${BASE_URL}/customers/${customerId}/pause/${pauseId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resume subscription');
    }
    return res.json();
  },

  // Billing
  getCustomerBill: async (customerId, year, month, date = null) => {
    const query = new URLSearchParams();
    if (year) query.append('year', year);
    if (month) query.append('month', month);
    if (date) query.append('date', date);

    const res = await fetch(`${BASE_URL}/customers/${customerId}/bill?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load bill breakdown');
    return res.json();
  },

  recordPayment: async (customerId, year, month, paymentData) => {
    const res = await fetch(`${BASE_URL}/customers/${customerId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, ...paymentData })
    });
    if (!res.ok) throw new Error('Failed to record payment');
    return res.json();
  },

  getMonthEndSummary: async (year, month, date = null) => {
    const query = new URLSearchParams();
    if (year) query.append('year', year);
    if (month) query.append('month', month);
    if (date) query.append('date', date);

    const res = await fetch(`${BASE_URL}/billing/month-end?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load month-end billing ledger');
    return res.json();
  },

  // Daily Dispatch Sheet
  getDispatchSheet: async (date = null) => {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${BASE_URL}/dispatch/today${query}`);
    if (!res.ok) throw new Error('Failed to load kitchen dispatch sheet');
    return res.json();
  },

  // Level 1 — T1: Clock & Morning Notifications
  getClock: async () => {
    const res = await fetch(`${BASE_URL}/clock`);
    if (!res.ok) throw new Error('Failed to fetch system clock');
    return res.json();
  },

  advanceClock: async (data = {}) => {
    const res = await fetch(`${BASE_URL}/clock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to advance clock');
    }
    return res.json();
  },

  getOutbox: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.customerId) query.append('customerId', params.customerId);
    const res = await fetch(`${BASE_URL}/outbox?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load outbox');
    return res.json();
  },

  clearOutbox: async () => {
    const res = await fetch(`${BASE_URL}/outbox`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear outbox');
    return res.json();
  },

  // Level 2 — T6: Subscription Transfer & Split Billing
  transferSubscription: async (customerId, transferData) => {
    const res = await fetch(`${BASE_URL}/subscriptions/${customerId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to transfer subscription');
    }
    return res.json();
  },

  getTransferPreview: async (customerId, effectiveDate) => {
    const res = await fetch(`${BASE_URL}/subscriptions/${customerId}/transfer-preview?effectiveDate=${effectiveDate}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate transfer preview');
    }
    return res.json();
  },

  // Level 3 — T4: Messy Data Importer
  importData: async (payload) => {
    const isString = typeof payload === 'string';
    const res = await fetch(`${BASE_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': isString ? 'text/plain' : 'application/json'
      },
      body: isString ? payload : JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to import data');
    }
    return res.json();
  }
};

