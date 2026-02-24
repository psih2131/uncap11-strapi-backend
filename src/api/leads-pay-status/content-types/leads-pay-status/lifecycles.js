function formatPaymentDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getFirstName(email) {
  if (!email || typeof email !== 'string') return 'Customer';
  const part = email.split('@')[0];
  return part ? part.charAt(0).toUpperCase() + part.slice(1) : 'Customer';
}

function formatFullInfo(fullInfo) {
  if (fullInfo == null) return '-';
  if (typeof fullInfo === 'string') return fullInfo;
  return JSON.stringify(fullInfo, null, 2);
}

async function sendPaymentStatusEmail(result) {
  const email = result?.user_email;
  if (!email) return;

  const firstName = getFirstName(email);
  const orderId = result?.payment_id || '-';
  const amountPaid = [result?.pay_amount, result?.pay_currency].filter(Boolean).join(' ') || [result?.price_amount, result?.price_currency].filter(Boolean).join(' ') || '-';
  const paymentDate = formatPaymentDate(result?.publishedAt || result?.createdAt);
  const fullDescription = formatFullInfo(result?.full_info);

  const subject = 'Thank you for your order – Uncap11';
  const text = `Hi ${firstName},

Thank you for your order.

We've successfully received your payment and your request is now being processed by our team.

Order Details
Order ID: ${orderId}
Amount: ${amountPaid}
Date: ${paymentDate}

Full data order:
${fullDescription}

Our team will contact you within 12–24 hours with onboarding instructions and the next steps to activate your access.

If you have any immediate questions, feel free to reply directly to this email.

We appreciate your trust and look forward to working with you.

Best regards,
Uncap11 Team`;

  const html = `
<p>Hi ${firstName},</p>

<p>Thank you for your order.</p>

<p>We've successfully received your payment and your request is now being processed by our team.</p>

<p><strong>Order Details</strong><br>
Order ID: ${orderId}<br>
Amount: ${amountPaid}<br>
Date: ${paymentDate}</p>

<p><strong>Full data order:</strong><br>
<pre style="background:#f5f5f5;padding:12px;overflow:auto;">${fullDescription.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></p>

<p>Our team will contact you within 12–24 hours with onboarding instructions and the next steps to activate your access.</p>

<p>If you have any immediate questions, feel free to reply directly to this email.</p>

<p>We appreciate your trust and look forward to working with you.</p>

<p>Best regards,<br>
Uncap11 Team</p>`;

  await strapi.plugin('email').service('email').send({
    to: email,
    subject,
    text,
    html,
  });
}

module.exports = {
  /**
   * API и админка: при создании published-версии (create+published или publish черновика)
   * Strapi v5 вызывает afterCreate с publishedAt. Черновики (publishedAt: null) пропускаем.
   */
  async afterCreate(event) {
    const { result } = event;
    console.log('[leads-pay-status] afterCreate', { publishedAt: result?.publishedAt, user_email: result?.user_email });
    if (!result?.publishedAt) return;
    await sendPaymentStatusEmail(result);
  },

  /**
   * Админка: update({ status: 'published' }) — на случай альтернативного пути.
   */
  async afterUpdate(event) {
    const { result, params } = event;
    console.log('[leads-pay-status] afterUpdate', {
      publishedAt: result?.publishedAt,
      user_email: result?.user_email,
      'params.data?.publishedAt': params?.data?.publishedAt,
    });
    if (!params?.data?.publishedAt) return;
    await sendPaymentStatusEmail(result);
  },
};