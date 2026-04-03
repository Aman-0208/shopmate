const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    sku: { type: String, required: true, trim: true, maxlength: 50 },
    hsn: { type: String, trim: true, maxlength: 20, default: '' },
    category: { type: String, required: true, trim: true, maxlength: 50 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minStock: { type: Number, required: true, min: 0, default: 5 },
    unit: {
      type: String,
      default: 'pcs',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', itemSchema);
