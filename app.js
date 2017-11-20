const app = require('express')()
const responseTime = require('response-time')
const redis = require('redis')

const github = require('./lib/github')

const cache = redis.createClient()

cache.on('error', err => console.log(`Redis error: ${err}`))

app.set('port', process.env.PORT || 3000)
app.use(responseTime())

app.get('/', (req, res) => {
  res.send('Welcome to caching experience!')
})

app.get('/api/:username', (req, res) => {
  const { username } = req.params

  cache.get(username, async (error, totalStars) => {
    if (error) console.log(error)
    if (totalStars) {
      res.send({
        status: 'OK',
        totalStars,
        source: 'Cache'
      })
    } else {
      try {
        const repos = await github.getUserRepositories(username)
        const totalStars = await github.computeTotalStars(repos)
        cache.setex(username, 60, totalStars)
        res.send({
          totalStars,
          source: 'GitHub'
        })
      } catch (err) {
        if (err.response.status === 404) {
          res.send(
            'The GitHub username could not be found. Try "rizafahmi" for example'
          )
        } else {
          res.send(err)
        }
      }
    }
  })
})

app.listen(app.get('port'), () => {
  console.log(`Magic happen at http://localhost:3000/`)
})
