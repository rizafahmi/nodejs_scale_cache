const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({
  name: String,
  description: String,
  orderNumber: Number,
  slug: String
})

module.exports = mongoose.model('Category', categorySchema)
