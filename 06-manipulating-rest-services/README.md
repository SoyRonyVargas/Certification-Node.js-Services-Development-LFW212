<h2>Implementación de POST, PUT y DELETE con Express (1)</h2>

<p>
En el capítulo anterior, generamos un proyecto de Express utilizando el ejecutable de línea de comandos <code>express</code> proporcionado por el módulo <code>express-generator</code> instalado globalmente.
Esto creó una carpeta llamada <code>my-express-service</code>. Después de instalar las dependencias del proyecto con <code>npm install</code>, también agregamos un archivo <code>model.js</code> con un método <code>read</code>,
añadimos un archivo <code>routes/bicycle/index.js</code> y actualizamos el archivo <code>app.js</code> para montar nuestra ruta <code>/bicycle</code> y modificar el manejador de errores para que en lugar de generar una respuesta en HTML, genere una respuesta en formato JSON.
</p>

<p>Ahora vamos a actualizar el archivo <code>model.js</code> en la carpeta <code>my-express-service</code> con el mismo código que el archivo <code>model.js</code> de la sección anterior:</p>

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
      .sort((a, b) => a - b)
      .map(Number)
      .filter((n) => !isNaN(n))
      .pop() + 1 + ''
  }

  function create (id, data, cb) {
    if (db.hasOwnProperty(id)) {
      const err = Error('resource exists')
      setImmediate(() => cb(err))
      return
    }
    db[id] = data
    setImmediate(() => cb(null, id))
  }

  function read (id, cb) {
    if (!(db.hasOwnProperty(id))) {
      const err = Error('not found')
      setImmediate(() => cb(err))
      return
    }
    setImmediate(() => cb(null, db[id]))
  }

  function update (id, data, cb) {
    if (!(db.hasOwnProperty(id))) {
      const err = Error('not found')
      setImmediate(() => cb(err))
      return
    }
    db[id] = data
    setImmediate(() => cb())
  }

  function del (id, cb) {
    if (!(db.hasOwnProperty(id))) {
      const err = Error('not found')
      setImmediate(() => cb(err))
      return
    }
    delete db[id]
    setImmediate(() => cb())
  }

}
</code></pre>


<br/>
<br/>
<br/>
<br/>
<br/>

<h2>Implementación de POST, PUT y DELETE con Express (2)</h2>

<p>
Las extensiones al archivo <code>model.js</code> fueron explicadas en la sección anterior. Ahora vamos a actualizar el archivo <code>routes/bicycle/index.js</code> para incluir las rutas POST, DELETE y PUT que agregamos en el proyecto con Fastify en la sección anterior, pero esta vez lo haremos todo de una sola vez.
</p>

<p>Actualiza el archivo <code>routes/bicycle/index.js</code> con el siguiente contenido:</p>

<pre><code class="language-javascript">
var express = require('express');
var router = express.Router();
var model = require('../model');

router.get('/:id', function(req, res, next) {
  model.bicycle.read(req.params.id, (err, result) => {
    if (err) {
      if (err.message === 'not found') next();
      else next(err);
    } else {
      res.send(result);
    }
  });
});

router.post('/', function(req, res, next) {
  var id = model.bicycle.uid();
  model.bicycle.create(id, req.body.data, (err) => {
    if (err) next(err);
    else res.status(201).send({ id });
  });
});

router.post('/:id/update', function(req, res, next) {
  model.bicycle.update(req.params.id, req.body.data, (err) => {
    if (err) {
      if (err.message === 'not found') next();
      else next(err);
    } else {
      res.status(204).send();
    }
  });
});

router.put('/:id', function(req, res, next) {
  model.bicycle.create(req.params.id, req.body.data, (err) => {
    if (err) {
      if (err.message === 'resource exists') {
        model.bicycle.update(req.params.id, req.body.data, (err) => {
          if (err) next(err);
          else res.status(204).send();
        });
      } else {
        next(err);
      }
    } else {
      res.status(201).send({});
    }
  });
});

router.delete('/:id', function(req, res, next) {
  model.bicycle.del(req.params.id, (err) => {
    if (err) {
      if (err.message === 'not found') next();
      else next(err);
    } else {
      res.status(204).send();
    }
  });
});

module.exports = router;
</code></pre>

<p>
Cada una de estas rutas implementa exactamente la misma lógica que las rutas en nuestro servicio con Fastify, pero aquí usamos el estilo de callbacks en lugar de <code>async/await</code>.
</p>

<p>
<strong>La razón de esto es doble:</strong>
</p>
<ol>
  <li>Refleja el estilo de codificación que se usa en servicios antiguos —y existen muchos servicios Express antiguos en el mundo real—.</li>
  <li>Usar <code>async/await</code> con Express no es recomendado. Express fue construido antes de que <code>async/await</code> fuera parte del lenguaje JavaScript, y como resultado, no siempre se comporta como se esperaría.</li>
</ol>


<br >
<br >
<br >
<br >
<br >
<br >
<br >
<br >
<br >
<br >
<br >

<h2>Implementación de POST, PUT y DELETE con Express (3)</h2>

<p>Por ejemplo, lo siguiente provocará <strong>fugas de memoria</strong>:</p>

<pre><code>// ⚠️ ADVERTENCIA: NUNCA HAGAS ESTO EN EXPRESS
router.get('/foo', async function(req, res, next) {
  throw Error('¿qué pasa aquí?');
  res.send('hola'); // <- esto nunca se alcanza
});
</code></pre>

<p>Esto ocurre porque <strong>Express no maneja el rechazo de promesas</strong> que resulta de lanzar un error dentro de una función <code>async</code>, y por lo tanto la solicitud no se finaliza (por un tiempo) y sigue manteniendo el estado. Esto puede convertirse en una fuente de problemas de rendimiento, depuración y mantenimiento.</p>

<p>Peor aún, este mismo escenario puede ocurrir sin lanzar errores explícitamente:</p>

<pre><code>// ⚠️ ADVERTENCIA: NUNCA HAGAS ESTO EN EXPRESS
router.get('/foo', async function(req, res, next) {
  res.dend('hola'); // error tipográfico: debería ser res.send
});
</code></pre>

<p>En este caso, se cometió un error de tipeo: se pretendía escribir <code>res.send</code>, pero se escribió <code>res.dend</code>. Como ese método no existe, se lanza un error (porque <code>undefined</code> no es una función) y se llega al mismo escenario.</p>

<p>Hay formas de evitar esto, como por ejemplo:</p>
<ul>
  <li>Hacer un <em>monkey-patching</em> del framework,</li>
  <li>Usar bloques <code>try/catch</code> en cada manejador de ruta y luego pasar el error capturado a <code>next()</code>.</li>
</ul>

<p>Sin embargo, <strong>ambos enfoques pueden (y probablemente lo harán) generar problemas a futuro</strong>, deuda técnica y distintos tipos de errores, ya que dependen de "hacks" o de convenciones que deben ser conocidas y respetadas por muchas personas.</p>

<blockquote>
  <strong>En resumen:</strong> <code>usa APIs basadas en callbacks con Express.</code>
</blockquote>

<h3>Probando las rutas</h3>

<p>Inicia el servicio en una terminal:</p>
<pre><code>npm start</code></pre>

<p>Y desde otra terminal, vamos a probar las nuevas rutas.</p>

<h4>Probar <code>POST /bicycle</code>:</h4>
<pre><code>node -e "http.request('http://localhost:3000/bicycle', { method: 'post', headers: {'content-type': 'application/json'}}, (res) => res.setEncoding('utf8').once('data', console.log.bind(null, res.statusCode))).end(JSON.stringify({data: {brand: 'Gazelle', color: 'red'}}))"
</code></pre>
<p>Debería imprimir:</p>
<pre><code>201 {"id":"3"}</code></pre>

<h4>Verificar la entrada creada (<code>GET</code>):</h4>
<pre><code>node -e "http.get('http://localhost:3000/bicycle/3', (res) => res.setEncoding('utf8').once('data', console.log))"
</code></pre>
<p>Resultado esperado:</p>
<pre><code>{"brand":"Gazelle","color":"red"}</code></pre>

<h4>Actualizar usando <code>POST /bicycle/:id/update</code>:</h4>
<pre><code>node -e "http.request('http://localhost:3000/bicycle/3/update', { method: 'post', headers: {'content-type': 'application/json', connection: 'close'}}, (res) => console.log(res.statusCode)).end(JSON.stringify({data: {brand: 'Ampler', color: 'blue'}}))"
</code></pre>

<h4>Verificar actualización:</h4>
<pre><code>node -e "http.get('http://localhost:3000/bicycle/3', (res) => res.setEncoding('utf8').once('data', console.log))"
</code></pre>
<p>Resultado esperado:</p>
<pre><code>{"brand":"Ampler","color":"blue"}</code></pre>

<h4>Crear nueva entrada con <code>PUT /bicycle/:id</code>:</h4>
<pre><code>node -e "http.request('http://localhost:3000/bicycle/99', { method: 'put', headers: {'content-type': 'application/json', connection: 'close'}}, (res) => console.log(res.statusCode)).end(JSON.stringify({data: {brand: 'VanMoof', color: 'black'}}))"
</code></pre>


<hr>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

<hr>
<h2>Implementación de POST, PUT y DELETE con Express (4)</h2>

<p>Este comando debería devolver: <strong>201</strong>. Como no existirá una entrada con el ID 99, esto creará una nueva entrada, que podemos recuperar con una solicitud GET a <code>http://localhost:3000/bicycle/99</code>:</p>

<pre><code>node -e "http.get('http://localhost:3000/bicycle/99', (res) => res.setEncoding('utf8').once('data', console.log))"</code></pre>

<p>Este comando debería mostrar:</p>

<pre><code>{"brand":"VanMoof","color":"black"}</code></pre>

<p>Ahora podemos hacer una solicitud PUT con datos diferentes para actualizarla:</p>

<pre><code>node -e "http.request('http://localhost:3000/bicycle/99', { method: 'put', headers: {'content-type': 'application/json', connection: 'close'}}, (res) => console.log(res.statusCode)).end(JSON.stringify({data: {brand: 'Bianchi', color: 'pink'}}))"</code></pre>

<p>Este comando debería devolver: <strong>204</strong>. Podemos verificar que la actualización ocurrió con lo siguiente:</p>

<pre><code>node -e "http.get('http://localhost:3000/bicycle/99', (res) => res.setEncoding('utf8').once('data', console.log))"</code></pre>

<p>Esto debería mostrar:</p>

<pre><code>{"brand":"Bianchi","color":"pink"}</code></pre>

<p>Finalmente, vamos a probar la ruta DELETE. Ejecutemos el siguiente comando:</p>

<pre><code>node -e "http.request('http://localhost:3000/bicycle/99', { method: 'delete', headers: {'connection': 'close'}}, (res) => console.log(res.statusCode)).end()"</code></pre>

<p>Esto debería devolver <strong>204</strong>, lo que significa que la entrada que acabamos de agregar con PUT fue eliminada exitosamente. Podemos comprobarlo con una solicitud GET:</p>

<pre><code>node -e "http.get('http://localhost:3000/bicycle/99', (res) => res.setEncoding('utf8').once('data', console.log))"</code></pre>

<p>Esto debería devolver un objeto JSON con una propiedad <code>type</code> que contiene <code>'error'</code>, una propiedad <code>status</code> con el valor 404, y una propiedad <code>stack</code> según los cambios que hicimos en <code>app.js</code> en el capítulo anterior.</p>


<hr>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<hr>

## Laboratorio 6.1 - Implementar un POST JSON RESTful
Consejos y mejores prácticas para el laboratorio
Al trabajar en los ejercicios del laboratorio, por favor ten en cuenta lo siguiente:

Al acceder a URLs externas incrustadas en el documento PDF a continuación, siempre usa clic derecho y abre en una nueva pestaña o ventana. Intentar abrir la URL haciendo clic directamente en ella cerrará la ventana o pestaña de tu curso.

Dependiendo del visor de PDF que uses, si cortas y pegas desde el documento, podrías perder el formato original. Por ejemplo, los guiones bajos podrían desaparecer y ser reemplazados por espacios. Por lo tanto, puede que necesites editar el texto manualmente. Siempre verifica que el texto pegado sea correcto.

[Ver PDF aquí](./assets/lab6.1.pdf)

# Laboratorio 6.2 - Implementar un DELETE RESTful con JSON

Consejos y buenas prácticas para el laboratorio
Al trabajar en los ejercicios de laboratorio, ten en cuenta lo siguiente:

Al acceder a URLs externas incrustadas en el documento PDF que se proporciona más abajo, usa siempre clic derecho y abre el enlace en una nueva pestaña o ventana. Si haces clic directamente en el enlace, se cerrará la pestaña/ventana del curso.

Dependiendo del visor de PDF que estés usando, si copias y pegas texto desde el documento, podrías perder el formato original. Por ejemplo, los guiones bajos (_) podrían desaparecer y ser reemplazados por espacios. Por lo tanto, puede que necesites editar el texto manualmente. Verifica siempre que el texto pegado sea correcto.

[Ver PDF aquí](./assets/lab6.2.pdf)