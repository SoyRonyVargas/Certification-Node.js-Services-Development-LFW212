'use strict'
const http = require('http')
const url = require('url')
const colors = ['Yellow', 'Red', 'Orange', 'Green', 'Blue', 'Indigo']
const MISSING = 2

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url)
  console.log(`Bicycle service received request for ${pathname}`);
  let id = pathname.match(/^\/(\d+)$/)
  if (!id) {
    res.statusCode = 400
    return void res.end()
  }

  id = Number(id[1])

  if (id === MISSING) {
    res.statusCode = 404
    return void res.end()
  }

  res.setHeader('Content-Type', 'application/json')

  res.end(JSON.stringify({
    id: id,
    color: colors[id % colors.length]
  }))
})

server.listen(process.env.PORT || 0, () => {
  const { port } = server.address()
  console.log('Bicycle service listening on localhost on port: ' + port)
})