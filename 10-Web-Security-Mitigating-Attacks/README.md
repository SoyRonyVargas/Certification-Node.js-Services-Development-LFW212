# Resumen y Objetivos del Capítulo
Los ataques pueden tomar diversas formas y tener distintos objetivos. A veces, se trata de robar información, ya sea del servidor o de otros usuarios. Otras veces, simplemente buscan causar interrupciones. El ejemplo más común de ataques enfocados en causar interrupciones es el ataque de Denegación de Servicio (DoS). En el caso de un ataque de Denegación de Servicio Distribuido (DDoS), esto implica automatizar una gran cantidad de máquinas para que cada una realice una enorme cantidad de solicitudes a un solo servicio.

Otros ataques de tipo DoS pueden involucrar muchas menos máquinas que realizan solicitudes a un punto final que ha sido identificado como vulnerable a un cierto tipo de carga útil (por ejemplo, una que se descomprime en un tamaño mucho mayor).

Este tema, por sí solo, es extenso y, en general, debe ser manejado por la infraestructura que rodea a un servicio Node.js desplegado. En este breve capítulo final, exploraremos rápidamente soluciones rápidas a estos escenarios cuando, por la razón que sea, un servicio en Node.js necesita manejar un ataque activo.

## Al finalizar este capítulo, deberías ser capaz de:

- Entender cómo bloquear la IP de un atacante en Express.

- Entender cómo bloquear la IP de un atacante en Fastify.

- Crear plugins y utilizar hooks en Fastify.

<br>
<br>
<br>
<br>
<br>

<h2>Bloquear la Dirección IP de un Atacante con Express</h2>

<p>Como se discutió en la introducción, un ataque puede provenir de múltiples máquinas, lo que normalmente significa que puede provenir de múltiples direcciones IP. Sin embargo, una vez que sabemos cómo bloquear una IP en un servicio, podemos bloquear tantas direcciones IP como queramos. En esta sección, veremos cómo bloquear una única dirección IP atacante en un servicio <strong>Express</strong>.</p>

<p>Para recalcar, esto no es algo que normalmente deba ser necesario; es únicamente una medida de último recurso en casos donde la infraestructura de despliegue no está manejando estos escenarios externamente a nuestro servicio.</p>

<p>Recuerda que <strong>Express</strong> es esencialmente un patrón de <em>middleware</em> sobre los módulos <strong>http</strong> (y <strong>https</strong>) del núcleo de Node. Los módulos http (y https) usan el módulo <strong>net</strong> para la funcionalidad TCP. Cada objeto <code>req</code> y <code>res</code> que se proporciona a la función <em>request listener</em> (que se pasa a <code>http.createServer</code>) tiene una propiedad <code>socket</code>, que es el <em>socket</em> TCP subyacente de la solicitud y respuesta.</p>

<p>Por lo tanto, <code>req.socket.remoteAddress</code> contendrá la dirección IP del cliente que está realizando una solicitud a un servicio Express.</p>

<p>Dado que Express pasa los objetos <code>req</code> y <code>res</code> a cada pieza de middleware registrada en el orden en que se registran, para bloquear una IP atacante, todo lo que necesitamos hacer es registrar una función de <em>middleware</em> antes que las demás y verificar <code>req.socket.remoteAddress</code>.</p>

<p>Supongamos que queremos bloquear la IP <strong>127.0.0.1</strong> (la IP de localhost, útil para propósitos de prueba) en una aplicación Express típica, generada con la herramienta CLI <code>express-generator</code>. Registraríamos el siguiente <em>middleware</em> antes de cualquier otro:</p>

<pre><code class="language-js">app.use(function (req, res, next) {
  if (req.socket.remoteAddress === '127.0.0.1') {
    const err = new Error('Forbidden');
    err.status = 403;
    next(err);
    return;
  }
  next();
});
</code></pre>

<p>Si <code>req.socket.remoteAddress</code> coincide con la dirección IP objetivo, generamos un nuevo error, establecemos la propiedad <code>status</code> de ese error en <strong>403</strong> (código de estado <em>Forbidden</em>) y llamamos a <code>next</code>, pasándole el error. Luego usamos <code>return</code> para salir de la función inmediatamente. Si <code>req.socket.remoteAddress</code> no coincide con la IP bloqueada, simplemente llamamos a <code>next</code> para que Express continúe con el siguiente middleware.</p>

<p>Recuerda que una aplicación Express típica tiene el siguiente middleware de manejo de errores al final de todos los middleware registrados:</p>

<pre><code class="language-js">// Manejador de errores
app.use(function(err, req, res, next) {
  // Configura las variables locales, mostrando el error solo en desarrollo
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Renderiza la página de error
  res.status(err.status || 500);
  res.render('error');
});
</code></pre>

<p>Por lo tanto, al establecer la propiedad <code>status</code> en el objeto <code>err</code> que creamos en nuestro middleware de bloqueo de IP, hacemos que el manejador de errores llame a <code>res.status(403)</code>, lo que resulta en una respuesta <strong>403 Forbidden</strong> del servicio.</p>

<p>Cuando se trata de un oponente hostil, a veces es mejor desinformar que dar retroalimentación precisa. Por ejemplo, devolver un estado <strong>404 Not Found</strong> podría ser más engañoso que un <strong>403 Forbidden</strong>, aunque probablemente no engañará a muchos.</p>

<p>Registrar el middleware de bloqueo de IP lo más temprano posible tiene sentido, ya que no queremos que un atacante acceda a ningún sistema. Sin embargo, también se podría argumentar que es mejor registrarlo después del middleware de registro (<em>logging middleware</em>). En ambos casos, la IP queda bloqueada, pero en el segundo, el bloqueo queda registrado en los logs.</p>

<p>En la siguiente sección aprenderemos cómo bloquear una dirección IP para que no acceda a un servicio <strong>Fastify</strong>.</p>
