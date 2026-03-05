function getFirstName(email) {
  if (!email || typeof email !== 'string') return 'Customer';
  const part = email.split('@')[0];
  return part ? part.charAt(0).toUpperCase() + part.slice(1) : 'Customer';
}

async function sendInvoiceRequestEmailToUser(result) {
  const email = result?.user_email;
  if (!email) return;

  const firstName = getFirstName(email);

  const subject = 'Your invoice request has been received';
  const text = `Hi ${firstName},

Thanks for your request.

We've received your invoice request and our team will prepare it shortly. You will receive your invoice within 12–24 hours.

If you have any questions in the meantime, feel free to reply to this email.

Best regards,
Uncap11 Team`;

  const html = `<p>Hi ${firstName},</p>
<p>Thanks for your request.</p>
<p>We've received your invoice request and our team will prepare it shortly. You will receive your invoice within 12–24 hours.</p>
<p>If you have any questions in the meantime, feel free to reply to this email.</p>
<p>Best regards,<br>Uncap11 Team</p>`;

  await strapi.plugin('email').service('email').send({
    to: email,
    subject,
    text,
    html,
  });
}

async function getEmailsList() {
  const records = await strapi.db.query('api::notifications-email-list.notifications-email-list').findMany({
    where: { publishedAt: { $notNull: true } },
    limit: 500,
  });
  return (records ?? []).map((r) => r?.current_email).filter(Boolean);
}

async function sendInvoiceRequestNotificationToAdmins(result) {
  if (!result) return;

  const emailsList = await getEmailsList();
  if (emailsList.length === 0) return;

  const paymentId = result?.payment_id ?? '-';
  const userEmail = result?.user_email ?? '-';
  const quantity = result?.quantity ?? '-';
  const accountType = result?.account_type ?? '-';
  const totalPrice = result?.total_price ?? '-';

  const subject = 'New invoice request – Uncap11';
  const text = `New invoice request\n\nPayment ID: ${paymentId}\nUser email: ${userEmail}\nQuantity: ${quantity}\nAccount type: ${accountType}\nTotal price: ${totalPrice}`;
  const html = `<p><strong>New invoice request</strong></p><p><strong>Payment ID:</strong> ${paymentId}</p><p><strong>User email:</strong> ${userEmail}</p><p><strong>Quantity:</strong> ${quantity}</p><p><strong>Account type:</strong> ${accountType}</p><p><strong>Total price:</strong> ${totalPrice}</p>`;

  const promises = emailsList.map((to) =>
    strapi.plugin('email').service('email').send({ to, subject, text, html })
  );
  await Promise.all(promises);
}

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (!result?.publishedAt) return;
    await sendInvoiceRequestEmailToUser(result);
    await sendInvoiceRequestNotificationToAdmins(result);
  },

  async afterUpdate(event) {
    const { result, params } = event;
    if (!params?.data?.publishedAt) return;
    await sendInvoiceRequestEmailToUser(result);
    await sendInvoiceRequestNotificationToAdmins(result);
  },
};
