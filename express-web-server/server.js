'use strict'

const http = require('http')
const { randomBytes } = require('crypto')

async function data () {
  return randomBytes(10).toString('base64')
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    const result = await data()
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(result)
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
})

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/')
})
