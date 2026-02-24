module.exports = ({ env }) => {
  const isDev = env('NODE_ENV') !== 'production';

  // В проде (в т.ч. Strapi Cloud) не трогаем email-конфиг
  if (!isDev) {
    return {};
  }

  // Локально используем nodemailer с jsonTransport (письма только в консоль)
  return {
    email: {
      config: {
        provider: 'nodemailer',
        providerOptions: {
          jsonTransport: true,
        },
        settings: {
          defaultFrom: 'dev@example.test',
          defaultReplyTo: 'dev@example.test',
        },
      },
    },
  };
};