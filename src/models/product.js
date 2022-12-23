const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0.1,
  },
  image: String,
  description: String,
});

productSchema.set('toJSON', { virtuals: false, versionKey: false });

const Product = new mongoose.model('Product', productSchema);
module.exports = Product;
