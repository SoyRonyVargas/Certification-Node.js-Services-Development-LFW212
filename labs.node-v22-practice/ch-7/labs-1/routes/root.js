'use strict'

const { BOAT_SERVICE_PORT, BRAND_SERVICE_PORT } = process.env

const boatSrv = `http://localhost:${BOAT_SERVICE_PORT}`
const brandSrv = `http://localhost:${BRAND_SERVICE_PORT}`

module.exports = async function (fastify, opts) {
  fastify.get('/:id', async function (request, reply) {
      const { id } = request.params
      
      if( isNaN(id) ) throw fastify.httpErrors.badRequest()

      const signal   = AbortSignal.timeout(1250);

      const bicycleReq = await fetch(`${boatSrv}/${id}`, { signal })

      if( 
        bicycleReq.status === 400
      ) throw fastify.httpErrors.badRequest()
      else if( 
        bicycleReq.status === 404 
      ) throw fastify.httpErrors.notFound()
      else if( 
        bicycleReq.status !== 200
      ) throw fastify.httpErrors.internalServerError()

      const p1 = bicycleReq.json()

      p1.catch(() => {})

      const results =  await Promise.allSettled([
        p1,
      ])

      for (const { reason } of results) {
        if (reason) throw reason
      }

      const [boat] = results.map(({ value }) => value)
      
      const brandReq = await fetch(`${brandSrv}/${boat.brand}`, { signal })
      const brandJson = brandReq.json()
      brandJson.catch(() => {})
      if (brandReq.status === 400) {
        throw fastify.httpErrors.badRequest()
      }
      else if (brandReq.status === 404) {
        throw fastify.httpErrors.notFound()
      }
      if (brandReq.status !== 200) {
        throw fastify.httpErrors.internalServerError()
      }

      const results2 = await Promise.allSettled([brandJson])
      for (const { reason } of results2) {
        if (reason) throw reason
      }

      const [brand] = results2.map(({ value }) => value)

      return {
        id: boat.id,
        color: boat.color,
        brand: brand.name,
      }


  })
}
