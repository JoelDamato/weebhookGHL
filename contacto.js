// models/Contacto.js
const mongoose = require('mongoose');

const contactoSchema = new mongoose.Schema({
  contact_id: { type: String, required: true, unique: true },
  first_name: String,
  last_name: String,
  full_name: String,
  email: String,
  phone: String,
  tags: String,
  country: String,
  date_created: Date,
  full_address: String,
  contact_type: String,
  utm_campaign: String,
  utm_content: String,
  utm_source: String,
  utm_term: String,
  Temperatura: String,
  location: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    fullAddress: String,
    id: String
  },
  workflow: {
    id: String,
    name: String
  },
  triggerData: mongoose.Schema.Types.Mixed,
  customData: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Contacto', contactoSchema);
