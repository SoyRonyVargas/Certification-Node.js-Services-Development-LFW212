'use strict'
const { Router } = require('express')
const data = require('../utils/data')
const router = Router()

// const html = `<html>
// <head>
//   <style>
//    body { background: #333; margin: 1.25rem }
//    a { color: yellow; font-size: 2rem; font-family: sans-serif }
//   </style>
// </head>
// <body>
//   <a href='/hello'>Hello</a>
// </body>
// </html>
// `

router.get('/', async (req, res) => {
  const result = await data()
  res.type('text/plain') // importante para que no lo mande como JSON
  res.send(result)
})

module.exports = router