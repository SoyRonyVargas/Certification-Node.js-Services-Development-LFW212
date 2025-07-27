const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
const PORT = 3000

// Middleware de autenticación
function authMiddleware(req, res, next) {
  if (req.query.token !== 'abc') {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// Middleware de proxy
const proxy = createProxyMiddleware({
  target: 'https://news.ycombinator.com',
  changeOrigin: true, // Cambia el origen de la solicitud al servidor de destino
  pathRewrite: (path, req) => path // mantener la ruta tal cual
})

// Aplica primero el auth y luego el proxy para todas las rutas
app.use('/', authMiddleware, proxy)

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
