const app = require('express')()
const responseTime = require('response-time')

app.set('port', process.env.PORT || 3000)
app.use(responseTime())

app.get('/', (req, res) => {
  res.send('Welcome to caching experience!')
})

app.listen(app.get('port'), () => {
  console.log(`Magic happen at http://localhost:3000/`)
})

