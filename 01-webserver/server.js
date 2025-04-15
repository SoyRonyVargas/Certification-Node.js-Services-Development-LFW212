'use strict'
const http = require('http');
const PORT = process.env.PORT || 3100
const url = require('url');

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>

</head>
<body>
    <h1>Hola mundo zzz</h1><a href="/test">Botoncito</a>
    </body>
</html>
`;
const pagina2 = `<h1>Pagina 2</h1>`;

const server = http.createServer((req,res) => {
    const { method } = req;
    
    if( method !== 'GET')
        return res.end('Method not allowed');

    res.statusCode = 200;

    const { url:urlReq } = req;

    const  { pathname } = url.parse(urlReq)
    
    res.setHeader('Content-Type', 'text/html');
    
    if( pathname === '/') return res.end(html)
    if( pathname === '/test') return res.end(pagina2)
        
    res.end(html);

})

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop the server`);
});