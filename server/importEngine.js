import { formatDateStr } from './billingEngine.js';

/**
 * Normalizes any messy phone string to clean 10-digit format.
 * Strips +91, dashes, spaces, brackets, leading zeros.
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  let str = String(rawPhone).trim();
  // Strip all non-digit characters
  let digits = str.replace(/\D/g, '');

  // If starts with 91 and has 12 digits (+91...), strip 91
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.substring(2);
  }
  // If starts with 0 and has 11 digits (098...), strip leading 0
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  return digits;
}

/**
 * Parses mixed date formats (DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, 1-Sep-2026, ISO strings)
 * into a clean YYYY-MM-DD string.
 */
export function parseMixedDate(rawDate) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  if (!str) return null;

  // 1. ISO or standard YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return formatDateStr(y, m, d);
    }
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY (or MM/DD/YYYY)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);

    // If p1 > 12, it must be DD/MM/YYYY
    if (p1 > 12 && p2 <= 12) {
      return formatDateStr(y, p2, p1);
    }
    // If p2 > 12, it must be MM/DD/YYYY
    if (p2 > 12 && p1 <= 12) {
      return formatDateStr(y, p1, p2);
    }
    // Default to Indian standard DD/MM/YYYY
    return formatDateStr(y, p2, p1);
  }

  // 3. Textual dates (e.g. 1-Sep-2026, 01 September 2026, Sep 1 2026, September 1, 2026)
  const parsedTimestamp = Date.parse(str);
  if (!isNaN(parsedTimestamp)) {
    const dObj = new Date(parsedTimestamp);
    return formatDateStr(dObj.getFullYear(), dObj.getMonth() + 1, dObj.getDate());
  }

  return null;
}

/**
 * Parses a single CSV line taking quotes and escaped quotes into account.
 */
export function parseCsvLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses raw CSV string into an array of objects based on header keys.
 */
export function parseCsv(csvString) {
  const lines = csvString.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  // Determine delimiter from first line
  const headerLine = lines[0];
  const delimiter = headerLine.includes('\t') ? '\t' : (headerLine.includes(';') ? ';' : ',');

  const headers = parseCsvLine(headerLine, delimiter).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      rows.push({ __isBlank: true, originalLineNumber: i + 1 });
      continue;
    }
    const cols = parseCsvLine(line, delimiter);
    const obj = { originalLineNumber: i + 1 };
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(obj);
  }

  return rows;
}

/**
 * Maps varying field names (e.g. "fullname", "mobile", "address", "phone_number")
 * to standard customer model fields.
 */
function extractRecordFields(raw) {
  if (!raw || typeof raw !== 'object') {
    return { isBlank: true };
  }

  if (raw.__isBlank) {
    return { isBlank: true, originalLineNumber: raw.originalLineNumber };
  }

  // Find name
  const name = (raw.name || raw.fullname || raw.customername || raw.customer || raw.client || '').trim();

  // Find phone
  const phone = (raw.phone || raw.phonenumber || raw.mobile || raw.contact || raw.mobilenumber || raw.tel || '').trim();

  // Find address
  const address = (raw.address || raw.deliveryaddress || raw.location || raw.addr || '').trim();

  // Find dates
  const rawStartDate = raw.startDate || raw.startdate || raw.start || raw.subscriptionstart || raw.date || '';
  const rawEndDate = raw.endDate || raw.enddate || raw.end || raw.subscriptionend || '';

  // Find plan / dietary
  const plan = raw.plan || raw.planName || raw.planname || raw.planId || raw.planid || '';
  const dietary = raw.dietary || raw.diet || '';
  const deliverySlot = raw.deliverySlot || raw.deliveryslot || raw.slot || '12:30 PM';
  const notes = raw.notes || raw.note || raw.comment || '';

  // Check if completely empty
  if (!name && !phone && !address && !rawStartDate) {
    return { isBlank: true, originalLineNumber: raw.originalLineNumber };
  }

  return {
    isBlank: false,
    originalLineNumber: raw.originalLineNumber,
    name,
    phone,
    address,
    rawStartDate,
    rawEndDate,
    plan,
    dietary,
    deliverySlot,
    notes,
    raw
  };
}

/**
 * Core messy customer list importer.
 * 
 * @param {Array|Object|string} input - JSON array, object or raw CSV string
 * @param {Object} db - The Database instance
 * @returns {Object} { imported: [], deduped: [], rejected: [], totalProcessed, counts }
 */
export function importMessyCustomers(input, db) {
  let records = [];

  if (typeof input === 'string') {
    // Attempt JSON parse first, else treat as CSV
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        records = parsed;
      } else if (parsed && typeof parsed === 'object') {
        records = parsed.customers || parsed.data || parsed.list || [parsed];
      }
    } catch {
      records = parseCsv(input);
    }
  } else if (Array.isArray(input)) {
    records = input;
  } else if (input && typeof input === 'object') {
    records = input.customers || input.data || input.list || [input];
  }

  const existingCustomers = db.getRawCustomers ? db.getRawCustomers() : (db.data.customers || []);
  const existingPhones = new Set(
    existingCustomers.map(c => normalizePhone(c.phone)).filter(p => p.length >= 10)
  );
  const existingNames = new Set(
    existingCustomers.map(c => c.name.trim().toLowerCase())
  );

  const seenPhonesInBatch = new Map(); // phone -> firstRecord

  const imported = [];
  const deduped = [];
  const rejected = [];

  const availablePlans = db.getPlans ? db.getPlans() : (db.data.plans || []);
  const defaultPlan = availablePlans[0] || {
    id: 'plan_classic_veg',
    name: 'Classic Veg Thali',
    monthlyPrice: 2800,
    dietary: 'Pure Veg'
  };

  for (let index = 0; index < records.length; index++) {
    const item = records[index];
    const fields = extractRecordFields(item);

    // 1. Check for blank / empty
    if (fields.isBlank) {
      rejected.push({
        index: index + 1,
        row: fields.originalLineNumber || index + 1,
        data: item,
        reason: 'Blank or empty record'
      });
      continue;
    }

    // 2. Validate Name
    if (!fields.name || fields.name.trim().length === 0) {
      rejected.push({
        index: index + 1,
        row: fields.originalLineNumber || index + 1,
        data: item,
        name: fields.name,
        phone: fields.phone,
        reason: 'Missing customer name'
      });
      continue;
    }

    // 3. Validate and clean phone
    const cleanPhone = normalizePhone(fields.phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      rejected.push({
        index: index + 1,
        row: fields.originalLineNumber || index + 1,
        data: item,
        name: fields.name,
        phone: fields.phone,
        reason: `Invalid phone number (${fields.phone || 'empty'}); must be at least 10 digits`
      });
      continue;
    }

    // 4. Check for duplicate phone in database
    if (existingPhones.has(cleanPhone)) {
      deduped.push({
        index: index + 1,
        row: fields.originalLineNumber || index + 1,
        name: fields.name,
        phone: cleanPhone,
        originalPhone: fields.phone,
        reason: `Phone ${cleanPhone} already registered to an existing customer in database`
      });
      continue;
    }

    // 5. Check for duplicate phone within this current import batch
    if (seenPhonesInBatch.has(cleanPhone)) {
      const prior = seenPhonesInBatch.get(cleanPhone);
      deduped.push({
        index: index + 1,
        row: fields.originalLineNumber || index + 1,
        name: fields.name,
        phone: cleanPhone,
        originalPhone: fields.phone,
        reason: `Duplicate phone number ${cleanPhone} in current batch (first seen at row ${prior.index})`
      });
      continue;
    }

    // 6. Clean and resolve dates
    const parsedStartDate = parseMixedDate(fields.rawStartDate) || '2026-09-01';
    const parsedEndDate = parseMixedDate(fields.rawEndDate) || '2026-09-30';

    // 7. Match Plan
    let matchedPlan = defaultPlan;
    if (fields.plan) {
      const pSearch = fields.plan.toLowerCase();
      const found = availablePlans.find(p => 
        p.id.toLowerCase() === pSearch || 
        p.name.toLowerCase().includes(pSearch) ||
        pSearch.includes(p.name.toLowerCase())
      );
      if (found) matchedPlan = found;
    }

    // 8. Construct clean customer subscription object
    const newCustomerData = {
      id: `cust_imp_${Date.now()}_${index}`,
      name: fields.name.trim(),
      phone: cleanPhone,
      email: fields.raw?.email ? fields.raw.email.trim() : `${fields.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
      address: fields.address || 'Standard Delivery Address',
      planId: matchedPlan.id,
      planName: matchedPlan.name,
      planMonthlyPrice: matchedPlan.monthlyPrice,
      dietary: fields.dietary || matchedPlan.dietary || 'Pure Veg',
      deliverySlot: fields.deliverySlot || '12:30 PM',
      notes: fields.notes || 'Imported via Batch Data Sync',
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      pauses: [],
      payments: {}
    };

    // Commit to database
    if (db.createCustomerDirect) {
      db.createCustomerDirect(newCustomerData);
    } else {
      db.data.customers.unshift(newCustomerData);
      db.save();
    }

    // Register in tracking sets
    seenPhonesInBatch.set(cleanPhone, { index: index + 1, name: fields.name });
    existingPhones.add(cleanPhone);

    imported.push(newCustomerData);
  }

  return {
    imported,
    deduped,
    rejected,
    summary: {
      totalProcessed: records.length,
      importedCount: imported.length,
      dedupedCount: deduped.length,
      rejectedCount: rejected.length,
      successRate: records.length > 0 ? Math.round((imported.length / records.length) * 100) : 0
    }
  };
}
