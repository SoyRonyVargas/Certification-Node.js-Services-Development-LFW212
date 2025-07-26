const fastify = require('fastify')({ logger: true })


fastify.register(require('./routes/index'))

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`Server listening at ${address}`)
})