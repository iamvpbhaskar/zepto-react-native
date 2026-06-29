const express = require('express')
const app = express()

app.put('/:id', (req, res) => res.send(`put id: ${req.params.id}`))
app.put('/:id/default', (req, res) => res.send(`put id default: ${req.params.id}`))

const request = require('supertest')

request(app)
  .put('/123/default')
  .expect(200)
  .end((err, res) => {
    if (err) throw err;
    console.log('Response:', res.text)
  });
