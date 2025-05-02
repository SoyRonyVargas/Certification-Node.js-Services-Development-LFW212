const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurar readline para pedir al usuario el nombre de la carpeta
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('¿Cómo deseas que se llame la carpeta del proyecto? ', (projectName) => {
  // Si el usuario no ingresa un nombre, usar un nombre por defecto
  if (!projectName) projectName = 'mi-servidor';

  // Crear carpetas base
  fs.mkdirSync(projectName);
  fs.mkdirSync(path.join(projectName, 'routes'));

  // Crear package.json con nodemon incluido
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    main: "main.js",
    scripts: {
      start: "node main.js",
      dev: "nodemon main.js"
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      http: "^0.0.1-security",
      "http-errors": "^2.0.0"
    },
    devDependencies: {
      nodemon: "^3.0.0"
    }
  };

  fs.writeFileSync(
    path.join(projectName, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Crear archivo nodemon.json (opcional)
  const nodemonConfig = {
    watch: ["main.js", "routes"],
    ext: "js json",
    exec: "node main.js"
  };
  fs.writeFileSync(
    path.join(projectName, 'nodemon.json'),
    JSON.stringify(nodemonConfig, null, 2)
  );

  // Crear archivo de rutas
  const routesContent = `const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hola desde la ruta raíz!');
});

module.exports = router;
`;

  fs.writeFileSync(path.join(projectName, 'routes', 'index.js'), routesContent);

  // Crear archivo main.js
  const mainJsContent = `const express = require('express');
const cors = require('cors');
const createError = require('http-errors');
const http = require('http');
const rutas = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

// Usar rutas
app.use('/', rutas);

// Middleware para rutas no encontradas
app.use((req, res, next) => {
  // if (req.method !== 'GET') {
  //   next(createError(405));
  //   return;
  // }
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
  console.log(\`Servidor escuchando en http://localhost:\${PORT}\`);
});
`;

  fs.writeFileSync(path.join(projectName, 'main.js'), mainJsContent);

  // Crear archivo .gitignore para ignorar node_modules
  const gitignoreContent = `node_modules/
  `;
  fs.writeFileSync(path.join(projectName, '.gitignore'), gitignoreContent);

  // Instrucciones finales
  console.log('✅ Proyecto creado correctamente.');
  console.log(`📂 Entra a la carpeta: cd ${projectName}`);
  console.log('📦 Instala dependencias: npm install');
  console.log('🚀 Inicia en modo desarrollo: npm run dev');

  // Cerrar readline
  rl.close();
});
