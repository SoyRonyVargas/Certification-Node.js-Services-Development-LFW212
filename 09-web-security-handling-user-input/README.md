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
