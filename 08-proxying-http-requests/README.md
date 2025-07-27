<h2>Visión General del Capítulo y Objetivos</h2>

<p>
  Un proxy HTTP es un servidor que reenvía solicitudes HTTP a servicios de backend y luego reenvía las respuestas a los clientes.
  A medida que el sistema escala, llega un punto en el que la necesidad de un proxy tiende a volverse inevitable.
  En términos generales, el proxying debería hacerse con una infraestructura especializada y configurable, como <strong>NGINX</strong>, <strong>Kong</strong>
  o servicios propietarios de puertas de enlace en la nube.
</p>

<p>
  Sin embargo, a veces hay requisitos complejos para un proxy que pueden resolverse mejor con un servicio de proxy en <strong>Node.js</strong>.
  Otras veces, los requisitos pueden ser tan simples (como hacer proxy a una sola ruta) que simplemente tiene sentido usar lo que ya está disponible en lugar de invertir en otra cosa.
  En otros casos, un servicio de proxy en Node.js puede servir como una solución temporal mientras se implementa una solución más completa de infraestructura de proxy.
</p>

<p>
  En este capítulo, exploraremos cómo hacer proxy de solicitudes HTTP con <strong>Fastify</strong>;
  sin embargo, los conceptos se pueden aplicar a cualquier framework web.
</p>

<h3>Al finalizar este capítulo, deberías ser capaz de:</h3>
<ul>
  <li>Hacer proxy de solicitudes HTTP para una sola ruta.</li>
  <li>Modificar datos durante el proxy.</li>
  <li>Crear un servidor de proxy completo.</li>
</ul>


<hr>
<br>
<br>
<br>
<br>
<hr>

<h2>Proxy de Múltiples Rutas con Origen Único</h2>

<p>En la sección anterior proporcionamos el endpoint deseado usando un parámetro en la cadena de consulta (<em>query string</em>) de la URL. Si hubiéramos establecido la opción <code>base</code>, podríamos haber usado un parámetro de tipo <code>path</code> en la cadena de consulta para solicitar una ruta específica del servicio upstream, según lo especificado por la opción <code>base</code>.</p>

<p>Sin embargo, en lugar de usar un parámetro en la cadena de consulta, podemos mapear directamente cada ruta (y de hecho, cada método HTTP) hecha a nuestro servicio proxy hacia el servicio upstream.</p>

<p>Inicialicemos un nuevo proyecto Fastify e instalemos <code>@fastify/http-proxy</code>:</p>

<pre><code>node -e "fs.mkdirSync('my-proxy')"
cd my-proxy
npm init fastify
npm install @fastify/http-proxy
</code></pre>

<p>Ahora hagamos que el archivo <code>app.js</code> se vea de la siguiente forma:</p>

<pre><code>'use strict'
const proxy = require('@fastify/http-proxy')
module.exports = async function (fastify, opts) {
  fastify.register(proxy, {
    upstream: 'https://news.ycombinator.com/'
  })
}
</code></pre>

<p>Eso es todo lo que necesitamos hacer. Iniciemos el servidor con <code>npm run dev</code> y naveguemos a <a href="http://localhost:3000">http://localhost:3000</a> en el navegador. Deberíamos ver algo similar a lo siguiente:</p>

<p><img src="https://d36ai2hkxl16us.cloudfront.net/course-uploads/e0df7fbf-a057-42af-8a1f-590912be5460/45rtwc654k8e-pastedimage0.png" alt="Ejemplo de Proxy" /></p>

<p>Si hacemos clic en cualquiera de los enlaces de la parte superior, por ejemplo en el enlace “new”, esto nos llevará a <code>http://localhost:3000/newest</code>, que mostrará la página actual de Hacker News con los artículos más recientes.</p>

<p>La librería <code>@fastify/http-proxy</code> utiliza el plugin <code>@fastify/reply-from</code> por debajo, con un <em>handler</em> que toma todas las solicitudes, determina la ruta y luego las pasa a <code>reply.from</code>.</p>

<p>Generalmente, la opción <code>upstream</code> se configuraría hacia un servicio interno que no es accesible públicamente, y típicamente se trataría de algún tipo de servicio de datos (por ejemplo, que proporcione respuestas JSON).</p>

<p>Como se mencionó en la introducción de este capítulo, el proxy generalmente debería hacerse con software de <em>gateway</em> preconfigurado y especializado.</p>

<p>Sin embargo, para escenarios únicos, este ejemplo simple podría extenderse de formas que podrían ser imposibles o poco prácticas con soluciones listas para usar.</p>

<p>Por ejemplo, imagina un enfoque de autenticación incipiente que aún no es compatible con proyectos más grandes. Podemos usar la opción <code>preHandler</code> soportada por <code>@fastify/http-proxy</code> para implementar lógica personalizada de autenticación.</p>

<p>Actualicemos el archivo <code>app.js</code> para que luzca así:</p>

<pre><code>'use strict'

const proxy = require('@fastify/http-proxy')
const sensible = require('@fastify/sensible')

module.exports = async function (fastify, opts) {
  fastify.register(sensible)
  fastify.register(proxy, {
    upstream: 'https://news.ycombinator.com/',
    async preHandler(request, reply) {
      if (request.query.token !== 'abc') {
        throw fastify.httpErrors.unauthorized()
      }
    }
  })
}
</code></pre>

<p>Como el proyecto inicial creado con <code>npm init fastify</code> ya incluye <code>@fastify/sensible</code>, podemos reutilizarlo en el archivo <code>app.js</code> sin necesidad de instalarlo. Ten en cuenta que las carpetas <code>routes</code> y <code>plugins</code>, así como <code>@fastify/autoload</code> y <code>fastify-plugin</code>, pueden eliminarse del proyecto en este punto (o mantenerse para un uso futuro).</p>

<p>Ahora, si aseguramos que el servidor esté corriendo (<code>npm run dev</code>) y navegamos a <code>http://localhost:3000/</code>, deberíamos ver:</p>

<pre><code>{"statusCode":401,"error":"Unauthorized","message":"Unauthorized"}</code></pre>

<p>Si navegamos a <code>http://localhost:3000/?token=abc</code>, volveremos a tener acceso al sitio upstream.</p>

<p>La función <code>preHandler</code> que proporcionamos al objeto de opciones puede ser una función <code>async</code> (y por tanto retornar una promesa). Si esa promesa es rechazada, la respuesta es interceptada. En nuestro caso, lanzamos el error <code>fastify.httpErrors.unauthorized</code> provisto por <code>@fastify/sensible</code> para crear una respuesta HTTP 401 Unauthorized.</p>


<br>
<br>
<br>
<br>

# Lab 8.1 - Implementar un Proxy Basado en Rutas HTTP
Consejos y Mejores Prácticas para el Laboratorio
Al trabajar en los ejercicios del laboratorio, por favor ten en cuenta lo siguiente:

Cuando accedas a URLs externas incrustadas en el documento PDF a continuación, siempre usa clic derecho y abre en una nueva pestaña o ventana. Intentar abrir la URL con un clic directo cerrará la ventana/pestaña de tu curso.

Dependiendo del visor de PDF que uses, si cortas y pegas texto del documento, podrías perder el formato original. Por ejemplo, los guiones bajos podrían desaparecer y ser reemplazados por espacios. Por ello, puede que necesites editar el texto manualmente. Siempre verifica que el texto pegado sea correcto.

[Ver PDF aquí](./assets/lap-8.1.pdf)