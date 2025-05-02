const express = require('express');
const cors = require('cors');
const createError = require('http-errors');
const http = require('http');
const rutas = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

// Usar rutas
// app.use('/', rutas);

// Middleware para rutas no encontradas
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.status(200).send('Saludo  ')
    return;
  }
  if (req.method === 'POST') {
    next(createError(405));
    return;
  }
  next(createError(404));
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send(err.message);
});

// Crear servidor HTTP
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
