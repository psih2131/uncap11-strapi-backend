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

  const agencyName = result?.agency_name ?? '-';
  const fullName = result?.full_name ?? '-';
  const userEmail = result?.user_email ?? '-';
  const website = result?.website ?? '-';
  const textMessage = result?.text_message ?? '-';

  const subject = 'New lead agency';
  const text = `New lead agency\n\nAgency: ${agencyName}\nName: ${fullName}\nEmail: ${userEmail}\nWebsite: ${website}\nMessage: ${textMessage}`;
  const html = `<p><strong>New lead agency</strong></p><p><strong>Agency:</strong> ${agencyName}</p><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${userEmail}</p><p><strong>Website:</strong> ${website}</p><p><strong>Message:</strong> ${textMessage}</p>`;

  const promises = emailsList.map((email) =>
    strapi.plugin('email').service('email').send({ to: email, subject, text, html })
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
