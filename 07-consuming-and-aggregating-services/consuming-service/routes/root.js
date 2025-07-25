'use strict'

const {
  BICYCLE_SERVICE_PORT = 4040, BRAND_SERVICE_PORT = 5050
} = process.env

const bicycleSrv = `http://localhost:${BICYCLE_SERVICE_PORT}`
const brandSrv = `http://localhost:${BRAND_SERVICE_PORT}`

module.exports = async function (fastify, opts) {
  fastify.get('/:id', async function (request, reply) {
    
    const { id } = request.params
    const noop = Function.prototype
    
    // Usamos AbortSignal para cancelar las peticiones si tardan mas de 3 segundos
    const signal = AbortSignal.timeout(3000)

    const bicycleReq = await fetch(`${bicycleSrv}/${id}`, { signal })
    const brandReq = await fetch(`${brandSrv}/${id}`, { signal })

    if (
        bicycleReq.status === 404 || 
        brandReq.status === 404
    ) throw fastify.httpErrors.notFound()

    if (bicycleReq.status === 400 || brandReq.status === 400)
      throw fastify.httpErrors.badRequest()

    const bicycleJsonPromise = bicycleReq.json()
    const brandJsonPromise = brandReq.json()

    // noop es una funcion vacia que se usa para evitar errores de promesas rechazadas
    // () => {} == Function.prototype es lo mismo
    bicycleJsonPromise.catch(noop)
    brandJsonPromise.catch(noop)

    // Espera a que ambas promesas terminen, sin importar si una falla.
    const results = await Promise.allSettled([bicycleJsonPromise, brandJsonPromise])

    for (const { reason } of results) if (reason) throw reason

    const [bicycle, brand] = results.map(({ value }) => value)

    return {
      id: bicycle.id,
      color: bicycle.color,
      brand: brand.name,
    }
  })
}
