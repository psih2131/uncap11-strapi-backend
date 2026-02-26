//get emails list from notifications-email-list
async function getEmailsList() {
  // strapi.db.query — напрямую к БД, возвращает массив (REST API использует те же данные)
  const records = await strapi.db.query('api::notifications-email-list.notifications-email-list').findMany({
    where: { publishedAt: { $notNull: true } },
    limit: 500,
  });
  return (records ?? []).map((r) => r?.current_email).filter(Boolean);
}

//send email to all emails in notifications-email-list
async function sendEmailNonification(result) {
    if (!result) return;

    const emailsList = await getEmailsList();
    console.log('[sendEmailNonification] emailsList:', emailsList, 'length:', emailsList.length, 'first:', emailsList[0]);
    for (const email of emailsList) {
        console.log('  -> email:', email);
    }
    console.log('send email done');

    const fullName = result?.full_name ?? '-';
    const userEmail = result?.user_email ?? '-';

    const subject = 'New lead sign up';
    const text = `New lead sign up\n\nName: ${fullName}\nEmail: ${userEmail}`;
    const html = `<p><strong>New lead sign up</strong></p><p><strong>Name:</strong> ${fullName}</p><p><strong>Email:</strong> ${userEmail}</p>`;

    //send email to all emails in notifications-email-list
    let promises = [];
    for (const email of emailsList) {
       promises.push(strapi.plugin('email').service('email').send({
            to: email,
            subject,
            text,
            html,
        }));    
        
    }
    let results = await Promise.all(promises);

    console.log('[sendEmailNonification] results:', results);
    

    
}

//lifecycles for leads-sing-up
module.exports = {
    /**
     * API и админка: при создании published-версии (create+published или publish черновика)
     * Strapi v5 вызывает afterCreate с publishedAt. Черновики (publishedAt: null) пропускаем.
     */
    async afterCreate(event) {
      const { result } = event;
      console.log('[leads-pay-status] afterCreate', { publishedAt: result?.publishedAt, user_email: result?.user_email });
      if (!result?.publishedAt) return;
      await sendEmailNonification(result);
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
      await sendEmailNonification(result);
    },
  };