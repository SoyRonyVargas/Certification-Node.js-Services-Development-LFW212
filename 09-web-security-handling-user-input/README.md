<h2>Descripción General del Capítulo y Objetivos</h2>

<p>
  Una de las cosas más importantes a considerar al construir servicios públicos (expuestos al exterior)
  es que <strong>cualquier usuario, en teoría, puede ser un usuario malicioso</strong>. Incluso si es solo
  uno entre millones, las consecuencias de un usuario malicioso que logre explotar código inseguro pueden ser significativas.
</p>

<p>
  Por lo tanto, es de <strong>suma importancia</strong> asegurarse siempre de que cualquier entrada externa
  a un servicio esté <strong>debidamente saneada</strong> para evitar que un atacante tenga control sobre los
  sistemas backend o utilice la autoridad del sitio para explotar a otros usuarios.
</p>

<p>
  El examen <strong>JSNSD</strong> evalúa conocimientos básicos de seguridad. Aunque existe un curso completo sobre
  escenarios como inyección SQL, ataques CSRF y XSS, ataques por temporización y de canal lateral,
  <strong>este capítulo se enfocará principalmente en la validación de entradas en rutas de servicios</strong> y en errores poco conocidos al recibir datos de usuarios.
</p>

<h3>Al finalizar este capítulo, deberías ser capaz de:</h3>
<ul>
  <li>Entender qué es la <strong>contaminación de parámetros (parameter pollution)</strong> y cómo evitarla.</li>
  <li>Aprender sobre <strong>validación de rutas en Express</strong>.</li>
  <li>Aprender sobre <strong>validación de rutas en Fastify</strong>.</li>
</ul>


<br>
<br>
<br>
<br>

<h2>Evitando ataques de contaminación de parámetros</h2>

<p>
La contaminación de parámetros (parameter pollution) explota un error que los desarrolladores suelen cometer al manejar parámetros en la cadena de consulta (query string). Incluso si sabemos que ese error puede ocurrir, es fácil olvidarlo. El objetivo principal de este tipo de ataque es hacer que un servicio se bloquee o se vuelva lento al generar una excepción en el servidor.
</p>

<p>
Ambas situaciones son formas de ataques de denegación de servicio (DoS). Veremos cómo mitigar este tipo de ataques (de forma limitada) en el siguiente capítulo. Prevenir este ataque requiere comprender cómo funciona el análisis de cadenas de consulta.
</p>

<h3>¿Qué es una cadena de consulta?</h3>

<p>
Una cadena de consulta es la parte de una URL que comienza con un signo de interrogación. Por ejemplo, en la URL: <code>http://example.com?name=bob</code>, la cadena de consulta es <code>?name=bob</code>.
</p>

<p>
Node.js y sus frameworks principales convierten esto en un objeto: <code>{ name: 'bob' }</code>. Sin embargo, cadenas como <code>?name=bob&name=dave</code> son válidas y se interpretan como <code>{ name: ['bob', 'dave'] }</code>.
</p>

<pre><code>node -p "querystring.parse('name=bob')"
// ➜ { name: 'bob' }

node -p "querystring.parse('name=bob&name=dave')"
// ➜ { name: ['bob', 'dave'] }
</code></pre>

<p>
Express también permite sintaxis con corchetes, como <code>?name[]=bob</code> que se interpreta como <code>{ name: ['bob'] }</code>. Fastify y el módulo <code>querystring</code> de Node no la soportan.
</p>

<h3>Problema: valores como string o array</h3>

<p>
Si no consideramos que un parámetro puede ser string o array, usar métodos como <code>.split</code> en un array causará errores.
</p>

<h4>Ejemplo de código con error:</h4>

<pre><code>router.get('/', (req, res, next) =&gt; {
  someAsynchronousOperation(() =&gt; {
    if (!req.query.name) {
      var err = new Error('Bad Request');
      err.status = 400;
      next(err);
      return;
    }
    var parts = req.query.name.split(' ');
    var last = parts.pop();
    var first = parts.shift();
    res.send({ first: first, last: last });
  });
});
</code></pre>

<p>
Con <code>?name=David Mark Clements&name=kaboom</code> el servicio se cae porque <code>req.query.name</code> es un array, y los arrays no tienen método <code>split</code>.
</p>

<p>
Express no puede capturar errores asíncronos sincrónicamente. Por eso Fastify, al usar <code>async/await</code>, maneja los errores propagándolos como rechazos de promesa y devolviendo un error 500.
</p>

<h3>Solución recomendada:</h3>

<pre><code>function convert(name) {
  var parts = name.split(' ');
  var last = parts.pop();
  var first = parts.shift();
  return { first: first, last: last };
}

router.get('/', (req, res, next) =&gt; {
  someAsynchronousOperation(() =&gt; {
    if (!req.query.name) {
      var err = new Error('Bad Request');
      err.status = 400;
      next(err);
      return;
    }
    if (Array.isArray(req.query.name)) {
      res.send(req.query.name.map(convert));
    } else {
      res.send(convert(req.query.name));
    }
  });
});
</code></pre>

<p>
Esta solución trata ambos casos, devolviendo un array si se reciben múltiples valores. La forma de manejar esto depende completamente del contexto.
</p>

<p>
Consulta el ejercicio <strong>labs-1</strong> para ver una demostración práctica de este problema.
</p>

<p>
En la siguiente sección exploraremos cómo validar entradas de usuario de forma más general.
</p>

<br>
<br>
<br>
<br>

# Validación de Rutas con Fastify (1)

En el Capítulo 6 implementamos un servicio RESTful CRUD tanto en Fastify como en Express.  
En esta sección, aplicaremos validación de rutas a ese servicio CRUD en Fastify,  
y en la siguiente sección lo haremos para el servicio equivalente en Express.

En el servicio de Fastify del Capítulo 6 creamos una carpeta llamada `my-service`.  
Era un servicio típico de Fastify, generado con `npm init fastify`.

La carpeta contenía un archivo `model.js` que exportaba los métodos:  
`create`, `read`, `update`, `del` y `uid`.

Integramos nuestras rutas en el archivo:  
`routes/bicycle/index.js`, que se ve así:

```js
'use strict'
const { promisify } = require('util')
const { bicycle } = require('../../model')
const { uid } = bicycle
const read = promisify(bicycle.read)
const create = promisify(bicycle.create)
const update = promisify(bicycle.update)
const del = promisify(bicycle.del)

module.exports = async (fastify, opts) => {
  const { notFound } = fastify.httpErrors

  fastify.post('/', async (request, reply) => {
    const { data } = request.body
    const id = uid()
    await create(id, data)
    reply.code(201)
    return { id }
  })

  fastify.post('/:id/update', async (request, reply) => {
    const { id } = request.params
    const { data } = request.body
    try {
      await update(id, data)
      reply.code(204)
    } catch (err) {
      if (err.message === 'not found') throw notFound()
      throw err
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    try {
      return await read(id)
    } catch (err) {
      if (err.message === 'not found') throw notFound()
      throw err
    }
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const { data } = request.body
    try {
      await create(id, data)
      reply.code(201)
      return { }
    } catch (err) {
      if (err.message === 'resource exists') {
        await update(id, data)
        reply.code(204)
      } else {
        throw err
      }
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params
    try {
      await del(id)
      reply.code(204)
    } catch (err) {
      if (err.message === 'not found') throw notFound()
      throw err
    }
  })
}

```

<br>
<br>
<br>
<br>

# Validación de Rutas con Fastify (2)

<p>Veamos la primera ruta <code>POST</code>:</p>

<pre><code>fastify.post('/', async (request, reply) =&gt; {
  const { data } = request.body
  const id = uid()
  await create(id, data)
  reply.code(201)
  return { id }
})
</code></pre>

<p>En el manejador de esta ruta se espera una propiedad <code>data</code> dentro de <code>request.body</code>.  
En el Capítulo 6 hicimos peticiones con esta forma de cuerpo: <code>{ data: { brand&lt;string&gt;, color&lt;string&gt; } }</code>.</p>

<p>Crearemos un esquema que valide esta estructura así:</p>

<pre><code>fastify.post('/', {
  schema: {
    body: {
      type: 'object',
      required: ['data'],
      additionalProperties: false,
      properties: {
        data: {
          type: 'object',
          required: ['brand', 'color'],
          additionalProperties: false,
          properties: {
            brand: { type: 'string' },
            color: { type: 'string' }
          }
        }
      }
    }
  }
}, async (request, reply) =&gt; {
  const { data } = request.body
  const id = uid()
  await create(id, data)
  reply.code(201)
  return { id }
})
</code></pre>

<p>Esto agrega más código a la declaración de la ruta. Si los esquemas crecen o se reutilizan, es mejor moverlos a variables o archivos separados.</p>

<p>Los métodos de ruta como <code>fastify.post</code> pueden aceptar tres argumentos:</p>
<ul>
  <li>La ruta (<code>string</code>)</li>
  <li>Un objeto de <strong>opciones</strong></li>
  <li>La función manejadora</li>
</ul>

<p>Consulta la <a href="https://fastify.dev/docs/v5.1.x/Reference/Routes/#options" target="_blank">documentación oficial</a> para más detalles.</p>

<p>La opción <code>schema</code> permite validar:</p>
<ul>
  <li><code>body</code></li>
  <li><code>query</code></li>
  <li><code>params</code></li>
  <li><code>headers</code></li>
  <li><code>response</code></li>
</ul>

<p>Declaramos <code>schema.body.type</code> como <code>'object'</code> y usamos <code>required</code> para indicar que <code>data</code> es obligatorio.  
También usamos <code>additionalProperties: false</code> para rechazar campos no definidos.</p>

<p>Fastify puede eliminar automáticamente propiedades extra si esta opción está en <code>false</code>.  
Este comportamiento puede personalizarse, ver <a href="https://fastify.dev/docs/v5.1.x/Reference/Validation-and-Serialization/#validator-compiler" target="_blank">validatorCompiler</a>.</p>

<p>Dentro de <code>schema.body.properties</code>, declaramos:</p>
<ul>
  <li><code>data</code> como un objeto</li>
  <li>Propiedades requeridas: <code>brand</code> y <code>color</code></li>
  <li>Ambas deben ser cadenas (<code>type: 'string'</code>)</li>
</ul>

<p>Podríamos agregar más validaciones como longitud o patrones, pero esto es suficiente para nuestro caso.</p>

<br>
<br>
<br>
<br>
<br>

# Validación de Rutas con Fastify (3)

<p>Si aún no lo hemos hecho, creemos una carpeta y ejecutemos:</p>

<pre><code>npm init fastify
npm install
</code></pre>

<p>Asegúrate de que haya un archivo llamado <code>model.js</code> en la raíz del proyecto que contenga el siguiente código:</p>

<pre><code>'use strict'

module.exports = {
  bicycle: bicycleModel()
}

function bicycleModel () {
  const db = {
    1: { brand: 'Veloretti', color: 'green' },
    2: { brand: 'Batavus', color: 'yellow' }
  }

  return {
    create, read, update, del, uid
  }

  function uid () {
    return Object.keys(db)
      .sort((a, b) =&gt; a - b)
      .map(Number)
      .filter((n) =&gt; !isNaN(n))
      .pop() + 1 + ''
  }

  function create (id, data, cb) {
    if (db.hasOwnProperty(id)) {
      const err = Error('el recurso ya existe')
      setImmediate(() =&gt; cb(err))
      return
    }
    db[id] = data
    setImmediate(() =&gt; cb(null, id))
  }

  function read (id, cb) {
    if (!(db.hasOwnProperty(id))) {
      const err = Error('no encontrado')
      setImmediate(() =&gt; cb(err))
      return
    }
    setImmediate(() =&gt; cb(null, db[id]))
  }

  function update (id, data, cb) {
    if (!(db.hasOwnProperty(id))) {
      const err = Error('no encontrado')
      setImmediate(() =&gt; cb(err))
      return
    }
    db[id] = data
    setImmediate(() =&gt; cb())
  }

  function del (id, cb) {
    if (!(db.hasOwnProperty(id))) {
      const err = Error('no encontrado')
      setImmediate(() =&gt; cb(err))
      return
    }
    delete db[id]
    setImmediate(() =&gt; cb())
  }

}
</code></pre>


<br>
<br>
<br>
<br>

# Validación de Rutas con Fastify (4)

Nuestro archivo routes/bicycle/index.js debería verse así:

```js
'use strict'
const { promisify } = require('util')
const { bicycle } = require('../../model')
const { uid } = bicycle
const read = promisify(bicycle.read)
const create = promisify(bicycle.create)
const update = promisify(bicycle.update)
const del = promisify(bicycle.del)

module.exports = async (fastify, opts) => {
  const { notFound } = fastify.httpErrors

  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['data'],
        additionalProperties: false,
        properties: {
          data: {
            type: 'object',
            required: ['brand', 'color'],
            additionalProperties: false,
            properties: {
              brand: { type: 'string' },
              color: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { data } = request.body
    const id = uid()
    await create(id, data)
    reply.code(201)
    return { id }
  })

  fastify.post('/:id/update', async (request, reply) => {
    const { id } = request.params
    const { data } = request.body
    try {
      await update(id, data)
      reply.code(204)
    } catch (err) {
      if (err.message === 'not found') throw notFound()
      throw err
    }
  })

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    try {
      return await read(id)
    } catch (err) {
      if (err.message === 'not found') throw notFound()
      throw err
    }
  })

  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params
    const { data } = request.body
    try {
      await create(id, data)
      reply.code(201)
      return { }
    } catch (err) {
      if (err.message === 'resource exists') {
        await update(id, data)
        reply.code(204)
      } else {
        throw err
      }
    }
  })

  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params
    try {
      await del(id)
      reply.code(204)
    } catch (err) {
      if (err.message === 'not found') throw notFound()
      throw err
    }
  })

}
```


<br>
<br>
<br>
<br>

# Validación de Rutas con Fastify (5)

<p>Si ejecutamos este servidor (<code>npm run dev</code>) y luego lanzamos el siguiente comando en otra terminal:</p>

<pre><code>node -e "http.request('http://localhost:3000/bicycle', { method: 'post', headers: {'content-type': 'application/json'}}, (res) =&gt; res.setEncoding('utf8').once('data', console.log.bind(null, res.statusCode))).end(JSON.stringify({data: {brand: 'Gazelle', color: 'red'}}))"
</code></pre>

<p>Habríamos hecho una solicitud exitosa. La salida de este comando sería:</p>

<pre><code>201 {"id": "3"}
</code></pre>

<p>El cuerpo (payload) de esta solicitud fue:</p>

<pre><code>{
  "data": {
    "brand": "Gazelle",
    "color": "red"
  }
}
</code></pre>

<p>Si cambiamos el cuerpo a:</p>

<pre><code>{
  "data": {
    "brand": "Gazelle",
    "colors": "red"
  }
}
</code></pre>

<p>Deberíamos obtener una respuesta 400 <strong>Bad Request</strong>. El siguiente comando intenta hacer una solicitud <code>POST</code> con este cuerpo inválido:</p>

<pre><code>node -e "http.request('http://localhost:3000/bicycle', { method: 'post', headers: {'content-type': 'application/json'}}, (res) =&gt; res.setEncoding('utf8').once('data', console.log.bind(null, res.statusCode))).end(JSON.stringify({data: {brand: 'Gazelle', colors: 'red'}}))"
</code></pre>

<p>Esto resultará en la siguiente salida:</p>

<pre><code>{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/data must have required property 'color'"
}
</code></pre>

<p>Fastify ha generado un mensaje que nos indica por qué los datos no son válidos.</p>

<hr>

<p>Si incluimos propiedades extra en el cuerpo, estas serán eliminadas automáticamente. Podemos probar enviando el siguiente cuerpo:</p>

<pre><code>{
  "data": {
    "brand": "Gazelle",
    "color": "red",
    "extra": "will be stripped"
  }
}
</code></pre>

<p>Con el siguiente comando:</p>

<pre><code>node -e "http.request('http://localhost:3000/bicycle', { method: 'post', headers: {'content-type': 'application/json'}}, (res) =&gt; res.setEncoding('utf8').once('data', console.log.bind(null, res.statusCode))).end(JSON.stringify({data: {brand: 'Gazelle', color: 'red', extra: 'will be stripped'}}))"
</code></pre>

<p>Este comando devolverá:</p>

<pre><code>201 {"id":"4"}
</code></pre>

<p>El registro se creó exitosamente. Sin embargo, si hacemos una solicitud <code>GET</code> a <code>http://localhost:3000/bicycle/4</code>, veremos que la clave extra <strong>no</strong> fue almacenada. Podemos hacer esta solicitud <code>GET</code> con el siguiente comando:</p>

<pre><code>node -e "http.get('http://localhost:3000/bicycle/4', (res) =&gt; res.setEncoding('utf8').once('data', console.log))"
</code></pre>

<p>La salida será:</p>

<pre><code>{
  "brand": "Gazelle",
  "color": "red"
}
</code></pre>

<p>La clave <code>extra</code> no fue almacenada porque en el momento en que accedemos a <code>request.body</code> en el controlador de la ruta, la propiedad <code>request.body.data.extra</code> ni siquiera existe.</p>

<hr>

<p>El esquema del cuerpo que declaramos para la primera ruta <code>POST</code> también aplica para la segunda ruta <code>POST</code> y para la ruta <code>PUT</code> en <code>routes/bicycle/index.js</code>, por lo que podemos <strong>reutilizar</strong> el esquema que escribimos.</p>

<p>Fastify admite <strong>esquemas compartidos</strong> que se pueden usar con la clave <code>$ref</code> de JSONSchema. Consulta la documentación oficial aquí:<br>
<a href="https://fastify.dev/docs/v5.1.x/Reference/Validation-and-Serialization/#adding-a-shared-schema" target="_blank" rel="noopener noreferrer">
Fastify - Validación y Serialización
</a></p>
