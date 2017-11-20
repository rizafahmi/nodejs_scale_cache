const app = require('express')()
const responseTime = require('response-time')

const github = require('./lib/github')

app.set('port', process.env.PORT || 3000)
app.use(responseTime())

app.get('/', (req, res) => {
  res.send('Welcome to caching experience!')
})

app.get('/api/:username', (req, res) => {
  const { username } = req.params

  github
    .getUserRepositories(username)
    .then(github.computeTotalStars)
    .then(totalStars => {
      res.send({
        totalStars,
        source: 'GitHub'
      })
    })
    .catch(response => {
      if (response.response.status === 404) {
        res.send(
          'The GitHub username could not be found. Try "rizafahmi" for example'
        )
      } else {
        res.send(response)
      }
    })
})

app.listen(app.get('port'), () => {
  console.log(`Magic happen at http://localhost:3000/`)
})
