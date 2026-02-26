'use strict';

/**
 * leads-sing-up controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::leads-sing-up.leads-sing-up', ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body || {};
    // Убеждаемся, что user_pass передаётся в create
    if (data?.user_pass) {
      ctx.request.body.data = { ...data, user_pass: data.user_pass };
    }
    return super.create(ctx);
  },
}));
