/**
 * Helper formatters for TiffinFlow
 */

export function formatCurrency(amount, symbol = '₹') {
  if (amount === undefined || amount === null) return `${symbol}0`;
  const formatted = Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
  return `${symbol}${formatted}`;
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatMonthYear(year, month) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
}

export function getCleanPhone(phone) {
  return phone ? phone.replace(/[^0-9]/g, '') : '';
}

/**
 * Generates a polite, clear WhatsApp invoice message for the customer
 */
export function buildWhatsAppBillingMessage({
  businessName,
  customerName,
  customerPhone,
  monthName,
  planName,
  monthlyPlanPrice,
  totalMonthWeekdays,
  deliveredDays,
  pausedDays,
  pausedList = [],
  billedAmount,
  customerSavings,
  currency = '₹',
  upiId
}) {
  const cleanPhone = getCleanPhone(customerPhone);
  // Add 91 prefix if 10-digit Indian number
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let pauseDetails = '';
  if (pausedList && pausedList.length > 0) {
    pauseDetails = `\n⏸️ *Paused Days Log (₹0 charged):*\n` +
      pausedList.map(p => ` • ${p.date}: ${p.reason}`).join('\n');
  }

  const upiText = upiId ? `\n💳 *Pay via UPI:* \`${upiId}\`` : '';

  const message = 
`🙏 *Namaste ${customerName} ji!*
Here is your lunch tiffin bill for *${monthName}* from *${businessName}*.

📦 *Plan:* ${planName} (${currency}${monthlyPlanPrice}/mo)
📅 *Total Scheduled Weekdays in Month:* ${totalMonthWeekdays} days
✅ *Days Lunch Was Served:* ${deliveredDays} days
⏸️ *Days Paused / Skipped:* ${pausedDays} days
${pauseDetails}

💰 *Pro-Rated Rate:* ~${currency}${Math.round((monthlyPlanPrice / totalMonthWeekdays) * 10) / 10} / day
🎉 *Your Total Savings (Paused Days):* ${currency}${customerSavings}
━━━━━━━━━━━━━━━━━━━
🧾 *Final Amount Payable:* *${currency}${billedAmount}*
━━━━━━━━━━━━━━━━━━━${upiText}

Thank you for being our valued subscriber! Please let us know if you need any adjustments. 🍱`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encoded}`;
}
