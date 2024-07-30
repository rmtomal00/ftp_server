const express = require('express')
const uploadRoute = require('./route/upload')
const app = express()
const port = 3000

app.use("/api", uploadRoute)

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
