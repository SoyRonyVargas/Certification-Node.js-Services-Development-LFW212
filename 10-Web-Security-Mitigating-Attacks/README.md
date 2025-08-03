# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)
This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).

<br>
<br>
<br>
<br>
<br>

<h2>Bloquear la Dirección IP de un Atacante con Fastify</h2>

<p>
A diferencia de Express, Fastify utiliza un enfoque basado en plugins y proporciona una abstracción sobre los objetos nativos <code>req</code> y <code>res</code> (llamados <code>request</code> y <code>reply</code> en Fastify) en lugar de agregarlos directamente como ocurre en Express. Para obtener la dirección IP del cliente que realiza la solicitud usamos <code>request.ip</code>.
</p>

<p>
Fastify también proporciona una API de <em>hooks</em> que nos permite intervenir en varios puntos del ciclo de vida de la solicitud/respuesta.
</p>

<p>
Al igual que con Express, donde se recomienda usar middleware de bloqueo de IP lo antes posible, en Fastify queremos usar un <em>hook</em> tan temprano como sea posible en el ciclo de vida de la solicitud. El primer <em>hook</em> en ese ciclo es <code>onRequest</code>.
</p>

<p>
En una aplicación típica de Fastify (por ejemplo, una creada con <code>npm init fastify</code>), la configuración personalizada del servicio debería hacerse mediante plugins. Para configurar el servidor y bloquear una IP, podríamos crear un archivo llamado <code>deny.js</code> ubicado en la carpeta <code>plugins</code>. Este será cargado automáticamente (ya que el archivo <code>app.js</code> usa <code>fastify-autoload</code> para cargar todos los plugins en dicha carpeta).
</p>

<p>
Si quisiéramos bloquear la IP <code>127.0.0.1</code> (la cual representa localhost, útil para hacer pruebas locales), el archivo <code>plugins/deny.js</code> se vería de la siguiente manera:
</p>

<pre><code class="language-js">'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.addHook('onRequest', async function (request) {
    if (request.ip === '127.0.0.1') {
      const err = new Error('Forbidden')
      err.status = 403
      throw err
    }
  })
})
</code></pre>

<p>
El módulo <code>fastify-plugin</code> "desencapsula" el plugin, lo que hace que se aplique a todo el servicio porque los plugins son registrados por <code>fastify-autoload</code> a nivel superior. Por eso pasamos nuestra función plugin a <code>fp</code> (de <code>fastify-plugin</code>), ya que queremos que el <em>hook</em> <code>onRequest</code> se aplique a todo el servicio. Para obtener más información sobre los plugins, consulta la <a href="https://www.fastify.io/docs/">documentación oficial de Fastify</a>.
</p>

<p>
Un plugin de Fastify es una función que devuelve una promesa o llama a un callback, y acepta como argumentos la instancia del servicio (llamada <code>fastify</code>) y un objeto de opciones (<code>opts</code>). Usamos una función <code>async</code> para que automáticamente se retorne una promesa. Llamamos al método <code>addHook</code> sobre la instancia del servicio (<code>fastify.addHook</code>), el primer argumento es un string que identifica el <em>hook</em> que queremos registrar (<code>onRequest</code>) y el segundo argumento es una función <code>async</code> que se llama y recibe el objeto <code>request</code> para cada solicitud entrante. También se le pasa el objeto <code>reply</code>, aunque en este caso no lo necesitamos.
</p>

<p>
Verificamos si <code>request.ip</code> coincide con la IP objetivo y, si es así, lanzamos un error con el código de estado 403. Fastify establecerá automáticamente el código de estado a partir de la propiedad <code>status</code> del error lanzado, si esta existe.
</p>

<p>
Como alternativa, podríamos implementar el plugin <code>plugins/deny.js</code> de la siguiente manera:
</p>

<pre><code class="language-js">'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async function (fastify, opts) {
  fastify.addHook('onRequest', async function (request) {
    if (request.ip === '127.0.0.1') {
      throw fastify.httpErrors.forbidden()
    }
  })
})
</code></pre>
