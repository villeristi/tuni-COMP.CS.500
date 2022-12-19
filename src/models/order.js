const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderedItem = new Schema({
  product: {
    _id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: String
  },
  quantity: {
    type: Number,
    min: 1,
    required: true,
  }
});

const orderSchema = new Schema({
  customerId:  {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  items: {
    type: [OrderedItem],
    minLength: 1,
  }
});

orderSchema.set('toJSON', { virtuals: false, versionKey: false });

const Order = new mongoose.model('Order', orderSchema);
module.exports = Order;
