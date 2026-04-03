const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    name: String,
    sku: String,
    hsn: String,
    price: Number,
    quantity: Number,
    unit: String,
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    items: [cartItemSchema],
    total: { type: Number, required: true },
    cgst: { type: Number, required: true },
    sgst: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    customerName: { type: String, default: '' },
    customerGstin: { type: String, default: '' },
    customerBank: { type: String, default: '' },
    customerAccountNo: { type: String, default: '' },
    customerIfsc: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
