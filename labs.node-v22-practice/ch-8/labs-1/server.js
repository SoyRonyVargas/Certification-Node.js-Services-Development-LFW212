const express = require('express');
const http = require('http');
const url = require('url');

const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    // Si no hay query ?url= -> Bad Request
    return res.status(400).send('Bad Request: url query parameter is required');
  }

  // Validar que el URL es HTTP y no HTTPS
  if (!targetUrl.startsWith('http://')) {
    return res.status(400).send('Bad Request: Only HTTP URLs are supported');
  }

  // Hacer la petición HTTP GET al URL objetivo
  http.get(targetUrl, (proxyRes) => {
    // Pasar el código de estado y los headers del servidor remoto
    res.status(proxyRes.statusCode);
    Object.entries(proxyRes.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Hacer pipe del cuerpo de la respuesta del servidor remoto al cliente
    proxyRes.pipe(res);
  }).on('error', (err) => {
    // Error en la petición hacia el servidor remoto
    console.error('Error en proxy:', err.message);
    res.status(500).send('Internal Server Error');
  });
});

// Para cualquier otra ruta, devolver 404
app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`Proxy server escuchando en puerto ${PORT}`);
});
