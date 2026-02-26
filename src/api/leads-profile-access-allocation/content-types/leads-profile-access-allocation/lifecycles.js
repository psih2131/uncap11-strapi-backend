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

  const gender = result?.gender ?? '-';
  const quantity = result?.Quantity ?? '-';
  const email = result?.Email ?? '-';
  const accountType = result?.account_type ?? '-';
  const periodOfUse = result?.period_of_use ?? '-';
  const textarea = result?.textarea ?? '-';

  const subject = 'New lead profile access allocation';
  const text = `New lead profile access allocation\n\nGender: ${gender}\nQuantity: ${quantity}\nEmail: ${email}\nAccount type: ${accountType}\nPeriod of use: ${periodOfUse}\nMessage: ${textarea}`;
  const html = `<p><strong>New lead profile access allocation</strong></p><p><strong>Gender:</strong> ${gender}</p><p><strong>Quantity:</strong> ${quantity}</p><p><strong>Email:</strong> ${email}</p><p><strong>Account type:</strong> ${accountType}</p><p><strong>Period of use:</strong> ${periodOfUse}</p><p><strong>Message:</strong> ${textarea}</p>`;

  const promises = emailsList.map((to) =>
    strapi.plugin('email').service('email').send({ to, subject, text, html })
  );
  await Promise.all(promises);
}

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (!result?.publishedAt) return;
    await sendEmailNotification(result);
  },

  async afterUpdate(event) {
    const { result, params } = event;
    if (!params?.data?.publishedAt) return;
    await sendEmailNotification(result);
  },
};
