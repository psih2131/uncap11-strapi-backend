async function sendTrialRequestEmailToUser(result) {
  const email = result?.work_email;
  if (!email) return;

  const name = result?.full_name ?? 'Customer';

  const subject = 'Free Trial Request Received';
  const text = `Hi ${name},

Thank you for submitting your free trial request.

We've successfully received your application, and our team is currently reviewing the details. This usually takes a short time, and you'll hear back from us soon with the next steps.

If we need any additional information, we'll reach out directly.

We appreciate your interest and look forward to getting you started.

Best regards,
Uncap11`;

  const html = `<p>Hi ${name},</p>
<p>Thank you for submitting your free trial request.</p>
<p>We've successfully received your application, and our team is currently reviewing the details. This usually takes a short time, and you'll hear back from us soon with the next steps.</p>
<p>If we need any additional information, we'll reach out directly.</p>
<p>We appreciate your interest and look forward to getting you started.</p>
<p>Best regards,<br>Uncap11</p>`;

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

async function sendEmailNotification(result) {
  if (!result) return;

  const emailsList = await getEmailsList();
  if (emailsList.length === 0) return;

  const fullName = result?.full_name ?? '-';
  const workEmail = result?.work_email ?? '-';
  const website = result?.website ?? '-';
  const role = result?.role ?? '-';

  const subject = 'New get trial form';
  const text = `New get trial form\n\nName: ${fullName}\nEmail: ${workEmail}\nWebsite: ${website}\nRole: ${role}`;
  const html = `<p><strong>New get trial form</strong></p><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${workEmail}</p><p><strong>Website:</strong> ${website}</p><p><strong>Role:</strong> ${role}</p>`;

  const promises = emailsList.map((email) =>
    strapi.plugin('email').service('email').send({ to: email, subject, text, html })
  );
  await Promise.all(promises);
}

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (!result?.publishedAt) return;
    await sendTrialRequestEmailToUser(result);
    await sendEmailNotification(result);
  },

  async afterUpdate(event) {
    const { result, params } = event;
    if (!params?.data?.publishedAt) return;
    await sendTrialRequestEmailToUser(result);
    await sendEmailNotification(result);
  },
};
