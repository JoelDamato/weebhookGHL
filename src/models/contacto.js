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
  date_created: String,
  full_address: String,
  contact_type: String,
  utm_content: String,
  utm_source: String,
  utm_medium: String,
  fbclid: String,
  utm_campaign: String,
  Temperatura: String,
  utm_term: String,
  location: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    fullAddress: String,
    id: String,
  },
  workflow: {
    id: String,
    name: String
  },
  triggerData: Object,
  customData: Object,
  notion_id: String  // 👈 Al nivel raíz, no dentro de location
});

module.exports = mongoose.model('Contacto', contactoSchema);
