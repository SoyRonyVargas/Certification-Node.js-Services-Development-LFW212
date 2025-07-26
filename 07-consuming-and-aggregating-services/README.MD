# Visión general y objetivos del capítulo

Un caso común para los servicios en Node.js, y los servicios RESTful en general, es proporcionar un rol de mediación, a veces conocido como el “frente del backend”. Estos son servicios que se ubican entre las solicitudes del cliente —especialmente desde un cliente en el navegador— y las API de backend, que pueden ser SOAP, RPC, bases de datos o incluso otras APIs basadas en REST.

En este capítulo implementaremos un servicio que consume y agrega datos desde otros servicios HTTP. Aunque los ejemplos estarán basados en Fastify, los conceptos y enfoques pueden aplicarse a cualquier framework.


<h3>Convención y Descubrimiento de Servicios</h3>

<p>
Cómo un servicio descubre a otro es un tema amplio, que va desde el uso de direcciones IP personalizadas, mallas de servicios con descubrimiento DNS y nombres de dominio, hasta soluciones que incorporan tablas hash distribuidas (DHT). Hay muchas formas en que un servicio puede descubrir a otro.
</p>

<p>
En la mayoría de los casos, contar con una infraestructura de despliegue que pueda inyectar valores en el proceso en tiempo de ejecución permite cierto grado de flexibilidad y capacidad de reconfiguración.
</p>

<p>
Un ejemplo simple sería cuando los servicios son referenciados mediante una URL que se inyecta como una <strong>variable de entorno</strong>.
</p>

<p>
Por ejemplo, si existieran un servicio de <strong>Bicicletas</strong> y uno de <strong>Botes</strong>, y otro servicio necesitara comunicarse con ellos, podría determinar la URL base de cada uno así:
</p>

<pre><code>const { BICYCLE_SERVICE, BOAT_SERVICE } = process.env;
</code></pre>

<p>Entonces podría hacer una solicitud a un endpoint de un servicio como este:</p>

<pre><code>const http = require('http');
http.get(`${BICYCLE_SERVICE}/some/route`, (res) => {
  /* hacer algo */
});
</code></pre>

<p>
En el momento del despliegue, la infraestructura operacional podría configurar esas variables de entorno con las URLs apropiadas. Durante el desarrollo local, estas variables de entorno podrían ser URLs del tipo <code>http://localhost:[puerto]</code>, donde <code>[puerto]</code> es el puerto en el que se ha iniciado el servicio correspondiente.
</p>

<p>
Una variación de este patrón es inyectar solo el número de puerto del servicio, en lugar de la URL completa. En ese caso, las variables de entorno se usarían así:
</p>

<pre><code>const { BICYCLE_SERVICE_PORT, BOAT_SERVICE_PORT } = process.env;
const http = require('http');
const bicycleSrv = `http://localhost:${BICYCLE_SERVICE_PORT}`;
http.get(`${bicycleSrv}/some/route`, (res) => {
  /* hacer algo */
});
</code></pre>

<p>
El enfoque que se utilice depende completamente de las decisiones tomadas al desplegar la aplicación. Sin embargo, en este capítulo se usará la técnica de <strong>inyectar el número de puerto mediante variables de entorno</strong>, ya que es la convención utilizada en el examen de certificación.
</p>


<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<br/>
<hr/>

<h2>Servicios Simulados (Mock Services)</h2>

<p>Para nuestros propósitos, crearemos dos <strong>servicios simulados</strong> que podemos ejecutar localmente para tener con qué interactuar.</p>

<h3>Servicio Simulado de Bicicletas</h3>

<p>Nuestro <strong>primer servicio simulado</strong> entrega entidades de datos de bicicletas y se ve así:</p>

<pre><code>
'use strict'
const http = require('http')
const url = require('url')
const colors = ['Yellow', 'Red', 'Orange', 'Green', 'Blue', 'Indigo']
const MISSING = 2

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url)
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
</code></pre>

<p>Guarda esto como <code>bicycle-service.js</code>.</p>

<h3>Servicio Simulado de Marcas</h3>

<p>El <strong>segundo servicio</strong> entrega nombres de marcas y se ve así:</p>

<pre><code>
'use strict'
const http = require('http')
const url = require('url')
const brands = ['Gazelle', 'Batavus', 'Azor', 'Cortina', 'Giant','Sparta']
const MISSING = 3

const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url)
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
    name: brands[id % brands.length]
  }))
})

server.listen(process.env.PORT || 0, () => {
  const { port } = server.address()
  console.log('Brand service listening on localhost on port: ' + port)
})
</code></pre>

<p>Guarda esto como <code>brand-service.js</code>.</p>

<h3>Notas</h3>

<p>Esta <strong>no es la forma recomendada</strong> de crear servicios para producción. Utiliza un framework adecuado para eso.</p>

<p>El código anterior es solo una manera <strong>rápida y simple</strong> de correr múltiples servicios localmente y empezar a interactuar con ellos inmediatamente.</p>

<h3>Iniciar los Servicios</h3>

<p>En una terminal, inicia el servicio de bicicletas con el comando:</p>
<pre><code>PORT=4040 node bicycle-service.js</code></pre>

<p>En otra terminal, inicia el servicio de marcas con el comando:</p>
<pre><code>PORT=5050 node brand-service.js</code></pre>

<p>Deberías tener ahora dos terminales con procesos Node.js ejecutándose:</p>

<ul>
  <li>Terminal 1 → Servicio de bicicletas en <code>localhost:4040</code></li>
  <li>Terminal 2 → Servicio de marcas en <code>localhost:5050</code></li>
</ul>

<br>

![Diagrama](./assets/1.png)

<h2>Navegación desde el navegador o cliente HTTP</h2>

<p>Navegar en un navegador (o cualquier cliente HTTP) a <code>http://localhost:4040/1</code> debería proporcionar la siguiente respuesta:</p>

<pre><code>{
  "id": 1,
  "color": "Red"
}
</code></pre>

<p>Nota que la propiedad <code>id</code> funciona como un identificador de índice, ya que correlaciona los datos en cada servicio. La marca correspondiente a una bicicleta con ID 1 también tiene un ID de 1. Es importante reconocer que esta <strong>no es una buena arquitectura de datos</strong>: cada entidad de bicicleta tiene una relación uno a uno con cada entidad de marca. Es un enfoque simplificado para nuestros fines.</p>

<p>Navegar a <code>http://localhost:5050/5</code> debería proporcionar la siguiente respuesta:</p>

<pre><code>{
  "id": 5,
  "name": "Sparta"
}
</code></pre>

<p><strong>¡Genial!</strong> Nuestros servicios simulados ya están configurados y funcionando. En la siguiente sección, crearemos un nuevo servicio y obtendremos datos desde uno de los servicios existentes.</p>

<p>Las secciones siguientes asumirán que los servicios aún están en ejecución y conectados a los puertos que especificamos en esta sección.</p>
