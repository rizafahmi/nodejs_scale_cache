const app = require('express')()
const hbs = require('express-handlebars')
const responseTime = require('response-time')
const redis = require('redis')
const mongoose = require('mongoose')
const faker = require('faker')

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
app.engine('handlebars', hbs({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')

app.get('/', async (req, res) => {
  const categories = await Category.find({}, [], { sort: { orderNumber: 1 } })
  res.render('home', { categories: categories })
})

app.get('/seeds', async (req, res) => {
  const count = await Category.count({})
  if (count < 1) {
    for (let i = 0; i < 100; i++) {
      const name = faker.lorem.words()
      const description = faker.lorem.paragraph()
      const orderNumber = faker.random.number()
      const slug = faker.lorem.slug()
      console.log(name, description, orderNumber, slug)
      const newCategory = new Category({ name, description, orderNumber, slug })
      newCategory.save().then(() => console.log('Data seeds...'))
    }
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
