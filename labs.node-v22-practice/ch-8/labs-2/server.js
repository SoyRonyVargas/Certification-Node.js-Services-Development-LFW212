const express = require('express');
const http = require('http');

const app = express();
const PORT = 3000;

app.use((req, res) => {
  const options = {
    hostname: 'jsonplaceholder.typicode.com',
    port: 80,
    path: req.originalUrl,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Error en el proxy:', err.message);
    res.status(500).send('Error interno del servidor');
  });

  req.pipe(proxyReq, { end: true });
});

app.listen(PORT, () => {
  console.log(`Servidor proxy escuchando en http://localhost:${PORT}`);
});
