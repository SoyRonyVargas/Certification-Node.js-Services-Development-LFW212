const http = require('http');

const port = 4001;

const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('¡Servidor funcionando correctamente!\n');
});

server.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Manejo de errores
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${port} está en uso`);
  } else {
    console.error('Error en el servidor:', error);
  }
});