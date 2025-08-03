'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.addHook('onRequest', async function (request) {
    if (request.ip === '127.0.0.1') {
      const err = new Error('Forbidden')
      err.status = 403
      throw err
    }
  })
})
