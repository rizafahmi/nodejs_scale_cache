const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({
  name: String,
  description: String,
  order: Number
})

module.exports = mongoose.model('Category', categorySchema)
