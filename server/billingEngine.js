/**
 * Billing Engine for Home-Style Tiffin Delivery Services
 * 
 * Rules:
 * 1. Delivery days are Monday to Friday (weekdays only).
 * 2. Paused days (vacation, festivals, etc.) are never charged.
 * 3. Pro-rated billing:
 *    Daily Rate = Monthly Plan Price / Total Scheduled Weekdays in Month
 *    Final Bill = Delivered Weekdays * Daily Rate
 *    Customer Savings = Paused Weekdays * Daily Rate
 */

export function isWeekday(dateObj) {
  const day = dateObj.getDay();
  return day >= 1 && day <= 5; // 1 = Monday, 5 = Friday
}

export function formatDateStr(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseDate(dateStr) {
  // Parses YYYY-MM-DD safely into a local date object without timezone shifts
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Returns all dates (YYYY-MM-DD) in a calendar month that are weekdays.
 */
export function getMonthWeekdays(year, month) {
  const weekdays = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (isWeekday(date)) {
      weekdays.push(formatDateStr(year, month, day));
    }
  }
  return weekdays;
}

/**
 * Expands a startDate -> endDate range into an array of YYYY-MM-DD strings.
 */
export function expandDateRange(startDateStr, endDateStr) {
  const dates = [];
  const curr = parseDate(startDateStr);
  const end = parseDate(endDateStr);

  while (curr <= end) {
    const y = curr.getFullYear();
    const m = curr.getMonth() + 1;
    const d = curr.getDate();
    dates.push(formatDateStr(y, m, d));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Checks if a specific date is paused for a customer.
 */
export function checkCustomerDatePaused(customer, dateStr) {
  if (!customer.pauses || customer.pauses.length === 0) {
    return { isPaused: false };
  }

  for (const pause of customer.pauses) {
    if (dateStr >= pause.startDate && dateStr <= pause.endDate) {
      return {
        isPaused: true,
        reason: pause.reason || 'Requested pause',
        pauseId: pause.id
      };
    }
  }

  return { isPaused: false };
}

/**
 * Determines a customer's status for a given date (defaults to today).
 * Status: 'active' (pack dabba), 'paused' (no dabba), 'weekend' (rest day), 'inactive' (before start or after end)
 */
export function getCustomerStatusForDate(customer, targetDateStr = null) {
  const targetDateObj = targetDateStr ? parseDate(targetDateStr) : new Date();
  const dateStr = targetDateStr || formatDateStr(
    targetDateObj.getFullYear(),
    targetDateObj.getMonth() + 1,
    targetDateObj.getDate()
  );

  // Check if weekend
  if (!isWeekday(targetDateObj)) {
    return {
      date: dateStr,
      status: 'weekend',
      label: 'Weekend (Rest Day)',
      packLunch: false
    };
  }

  // Check subscription period
  if (customer.startDate && dateStr < customer.startDate) {
    return {
      date: dateStr,
      status: 'inactive',
      label: 'Subscription Not Started',
      packLunch: false
    };
  }
  if (customer.endDate && dateStr > customer.endDate) {
    return {
      date: dateStr,
      status: 'inactive',
      label: 'Subscription Ended',
      packLunch: false
    };
  }

  // Check pause
  const pauseCheck = checkCustomerDatePaused(customer, dateStr);
  if (pauseCheck.isPaused) {
    return {
      date: dateStr,
      status: 'paused',
      label: `Paused (${pauseCheck.reason})`,
      reason: pauseCheck.reason,
      pauseId: pauseCheck.pauseId,
      packLunch: false
    };
  }

  return {
    date: dateStr,
    status: 'active',
    label: 'Active (Deliver Today)',
    packLunch: true
  };
}

/**
 * Calculates a customer's monthly pro-rated bill.
 * 
 * @param {Object} customer - Customer object with plan details and pauses
 * @param {number} year - Billing year (e.g. 2026)
 * @param {number} month - Billing month (1-12)
 * @param {string} todayDateStr - Optional override for current date (YYYY-MM-DD)
 */
export function calculateCustomerMonthlyBill(customer, year, month, todayDateStr = null) {
  const monthWeekdays = getMonthWeekdays(year, month);
  const totalMonthWeekdays = monthWeekdays.length;

  if (totalMonthWeekdays === 0) {
    throw new Error(`Invalid month: ${year}-${month}`);
  }

  const monthlyPlanPrice = Number(customer.planMonthlyPrice || customer.plan?.monthlyPrice || 0);
  const dailyRate = totalMonthWeekdays > 0 ? (monthlyPlanPrice / totalMonthWeekdays) : 0;

  // Filter weekdays applicable to customer subscription range
  const applicableWeekdays = monthWeekdays.filter(dateStr => {
    if (customer.startDate && dateStr < customer.startDate) return false;
    if (customer.endDate && dateStr > customer.endDate) return false;
    return true;
  });

  const totalEligibleWeekdays = applicableWeekdays.length;

  // Track each weekday's status
  const pausedDaysList = [];
  const deliveredDaysList = [];
  const upcomingActiveDaysList = [];
  const upcomingPausedDaysList = [];

  const todayStr = todayDateStr || formatDateStr(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  );

  applicableWeekdays.forEach(dateStr => {
    const pauseCheck = checkCustomerDatePaused(customer, dateStr);
    const isPastOrToday = dateStr <= todayStr;

    if (pauseCheck.isPaused) {
      pausedDaysList.push({
        date: dateStr,
        reason: pauseCheck.reason,
        pauseId: pauseCheck.pauseId
      });
      if (!isPastOrToday) {
        upcomingPausedDaysList.push(dateStr);
      }
    } else {
      if (isPastOrToday) {
        deliveredDaysList.push(dateStr);
      } else {
        upcomingActiveDaysList.push(dateStr);
      }
    }
  });

  const pausedCount = pausedDaysList.length;
  // Effective delivered weekdays in the full month cycle (eligible minus pauses)
  const effectiveDeliveredCount = Math.max(0, totalEligibleWeekdays - pausedCount);

  // Pro-rated amounts
  const rawBilledAmount = effectiveDeliveredCount * dailyRate;
  const rawSavingsAmount = pausedCount * dailyRate;

  // Rounded for currency presentation
  const billedAmount = Math.round(rawBilledAmount * 100) / 100;
  const customerSavings = Math.round(rawSavingsAmount * 100) / 100;

  // Generate day-by-day calendar data for frontend visualization
  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarDays = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = formatDateStr(year, month, d);
    const isWkday = isWeekday(date);
    const isPastOrToday = dateStr <= todayStr;

    let dayStatus = 'weekend';
    let label = 'Weekend (Rest Day)';
    let reason = null;

    if (isWkday) {
      if (customer.startDate && dateStr < customer.startDate) {
        dayStatus = 'not_started';
        label = 'Before Subscription Start';
      } else if (customer.endDate && dateStr > customer.endDate) {
        dayStatus = 'ended';
        label = 'After Subscription End';
      } else {
        const pauseCheck = checkCustomerDatePaused(customer, dateStr);
        if (pauseCheck.isPaused) {
          dayStatus = isPastOrToday ? 'paused' : 'upcoming_paused';
          label = `Paused: ${pauseCheck.reason}`;
          reason = pauseCheck.reason;
        } else {
          dayStatus = isPastOrToday ? 'delivered' : 'upcoming_active';
          label = isPastOrToday ? 'Delivered Lunch' : 'Scheduled Delivery';
        }
      }
    }

    calendarDays.push({
      date: dateStr,
      dayNumber: d,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isWeekday: isWkday,
      isToday: dateStr === todayStr,
      status: dayStatus,
      label,
      reason
    });
  }

  return {
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    billingMonth: `${year}-${String(month).padStart(2, '0')}`,
    monthName: new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    planName: customer.planName || customer.plan?.name || 'Monthly Tiffin Plan',
    monthlyPlanPrice,
    dailyRate: Math.round(dailyRate * 100) / 100,
    totalMonthWeekdays,
    totalEligibleWeekdays,
    deliveredWeekdaysCount: effectiveDeliveredCount,
    actualDeliveredSoFarCount: deliveredDaysList.length,
    pausedWeekdaysCount: pausedCount,
    upcomingActiveCount: upcomingActiveDaysList.length,
    billedAmount,
    customerSavings,
    pausedDaysList,
    calendarDays
  };
}
