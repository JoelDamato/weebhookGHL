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

  // UTM y tracking (pueden venir planos o anidados)
  utm_content: String,
  utm_source: String,
  fbclid: String,
  utm_campaign: String,
  utm_term: String,
  utm_medium: String, // Para IG/Fb Ads también
  // Puedes agregar más campos UTM si en el futuro surgen

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

  contact: Object,      // <-- Guarda el objeto attributionSource entero si viene (para debugging/futuro)
  triggerData: Object,
  customData: Object,
  notion_id: String     // 👈 Al nivel raíz, no dentro de location
});

module.exports = mongoose.model('Contacto', contactoSchema);
