'use strict'
const express = require('express')
const app = express()
const router = express.Router()
const { PORT = 3000 } = process.env


const handleUpper = ( str = '' ) => {
  if( typeof str !== 'string' && Array.isArray(str) ) return str.map( opt => opt.toUpperCase() ) 
  return str.toUpperCase()
}

router.get('/', (req, res) => {
  setTimeout(() => {
    res.send(handleUpper((req.query.un || '')))
  }, 1000)
})

app.use(router)

app.use( (req , res , next ) => {
  res.status(400).send('Error')
})

app.listen(PORT, () => {
  console.log(`Express server listening on ${PORT}`)
})