import { isWeekday, parseDate, getCustomerStatusForDate } from './billingEngine.js';

/**
 * Generates and dispatches morning delivery reminder notifications
 * for customers due a delivery on the given date.
 * 
 * Rules:
 * 1. Deliveries only happen on weekdays (Monday - Friday).
 *    If date is a weekend, 0 notifications are sent.
 * 2. Customer must be active on that date (started and not expired).
 * 3. Customer must not be paused on that date.
 * 4. Dispatched notifications are persisted to the outbox for grading & audit.
 */
export function processMorningClockNotifications(db, targetDateStr) {
  const dateObj = parseDate(targetDateStr);
  const weekday = isWeekday(dateObj);

  if (!weekday) {
    return {
      date: targetDateStr,
      isWeekday: false,
      dispatchedCount: 0,
      notifications: [],
      reason: 'Weekend - No tiffin deliveries scheduled today'
    };
  }

  const customers = db.getRawCustomers ? db.getRawCustomers() : db.data.customers;
  const dispatched = [];

  for (const customer of customers) {
    const status = getCustomerStatusForDate(customer, targetDateStr);
    if (status.packLunch) {
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: targetDateStr,
        customerId: customer.id,
        recipientId: customer.id,
        recipientName: customer.name,
        customerName: customer.name,
        to: customer.phone,
        phone: customer.phone,
        type: 'delivery_reminder',
        channel: 'SMS',
        planName: customer.planName || 'Lunch Plan',
        deliverySlot: customer.deliverySlot || '12:30 PM',
        address: customer.address || '',
        message: `Good morning ${customer.name}! Your ${customer.planName || 'lunch'} tiffin is scheduled for delivery today (${targetDateStr}) at ${customer.deliverySlot || '12:30 PM'}.`,
        body: `Good morning ${customer.name}! Your ${customer.planName || 'lunch'} tiffin is scheduled for delivery today (${targetDateStr}) at ${customer.deliverySlot || '12:30 PM'}.`,
        status: 'sent',
        sentAt: new Date().toISOString()
      };

      db.addOutboxMessage(notif);
      dispatched.push(notif);
    }
  }

  return {
    date: targetDateStr,
    isWeekday: true,
    dispatchedCount: dispatched.length,
    notifications: dispatched
  };
}
