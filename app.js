const app = require('express')()
const responseTime = require('response-time')
const redis = require('redis')
const mongoose = require('mongoose')

const github = require('./lib/github')
const Category = require('./models/category')

const cache = redis.createClient()
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/category', {
  useMongoClient: true
})

cache.on('error', err => console.log(`Redis error: ${err}`))

app.set('port', process.env.PORT || 3000)
app.use(responseTime())

app.get('/', (req, res) => {
  res.send('Welcome to caching experience!')
})

app.get('/seeds', async (req, res) => {
  const count = await Category.count({})
  if (count < 1) {
    const data = [
      { name: 'Home', description: 'Home page', order: 1 },
      { name: 'About', description: 'About page', order: 2 },
      { name: 'Contact', description: 'Contact page', order: 3 }
    ]
    Category.collection.insert(data, (err, docs) => {
      if (err) console.log(err)
      console.log(docs)
    })
  }
  res.send('Seeding data...')
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
