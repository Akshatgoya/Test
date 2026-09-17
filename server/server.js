import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Config
app.get('/api/config', (req, res) => {
  res.json(db.getConfig());
});

app.put('/api/config', (req, res) => {
  const updated = db.updateConfig(req.body);
  res.json(updated);
});

// Plans
app.get('/api/plans', (req, res) => {
  res.json(db.getPlans());
});

app.post('/api/plans', (req, res) => {
  try {
    const plan = db.createPlan(req.body);
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Customers
app.get('/api/customers', (req, res) => {
  const { search, status, date } = req.query;
  const customers = db.getCustomers({
    search: search || '',
    statusFilter: status || 'all',
    targetDate: date || null
  });
  res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
  const { date } = req.query;
  const customer = db.getCustomerById(req.params.id, date);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, phone, address, planId } = req.body;
    if (!name || !phone || !address || !planId) {
      return res.status(400).json({ error: 'Name, phone, address, and plan are required.' });
    }
    const customer = db.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  const updated = db.updateCustomer(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(updated);
});

app.delete('/api/customers/:id', (req, res) => {
  const deleted = db.deleteCustomer(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json({ success: true });
});

// Pause and Resume
app.post('/api/customers/:id/pause', (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const customer = db.addPause(req.params.id, { startDate, endDate, reason });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/customers/:id/pause/:pauseId', (req, res) => {
  try {
    const customer = db.removePause(req.params.id, req.params.pauseId);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pro-Rated Monthly Billing
app.get('/api/customers/:id/bill', (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year || now.getFullYear();
    const month = req.query.month || (now.getMonth() + 1);
    const date = req.query.date || null;

    const bill = db.getCustomerBill(req.params.id, year, month, date);
    res.json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/customers/:id/payment', (req, res) => {
  try {
    const now = new Date();
    const year = req.body.year || now.getFullYear();
    const month = req.body.month || (now.getMonth() + 1);
    const { status, method, transactionId, amount, notes } = req.body;

    const bill = db.recordPayment(req.params.id, year, month, { status, method, transactionId, amount, notes });
    res.json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Month-End Billing Ledger for All Customers
app.get('/api/billing/month-end', (req, res) => {
  try {
    const now = new Date();
    const year = req.query.year || now.getFullYear();
    const month = req.query.month || (now.getMonth() + 1);
    const date = req.query.date || null;

    const summary = db.getMonthEndSummary(year, month, date);
    res.json(summary);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Daily Dispatch Sheet (Today's Packing Manifest)
app.get('/api/dispatch/today', (req, res) => {
  try {
    const { date } = req.query;
    const dispatch = db.getDispatchSheet(date);
    res.json(dispatch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🥘 Tiffin Service Management API running on port ${PORT}`);
});
