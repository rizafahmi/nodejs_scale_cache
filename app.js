const app = require('express')()
const responseTime = require('response-time')

const github = require('./lib/github')

app.set('port', process.env.PORT || 3000)
app.use(responseTime())

app.get('/', (req, res) => {
  res.send('Welcome to caching experience!')
})

app.get('/api/:username', async (req, res) => {
  const { username } = req.params

  try {
    const repos = await github.getUserRepositories(username)
    const totalStars = await github.computeTotalStars(repos)
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
})

app.listen(app.get('port'), () => {
  console.log(`Magic happen at http://localhost:3000/`)
})
