const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema({
  full_name: String,
  first_name: String,
  last_name: String,
  phone: String,
  email: String,
  contact_id: String,
  tags: String,
  Temperatura: String,
  Embudo_1: String,
  Estrategia: [String],
  Mensualidad: [String],
  Recursos: [String],
  Productos_adquiridos: [String],
  Sub_productos: [String],
  Ultimo_contacto: Date,
  utm_campaign: String,
  utm_content: String,
  utm_medium: String,
  utm_source: String,
  utm_term: String,
  fbclid: String,
  date_created: Date,
  country: String,
  contact_type: String,
  full_address: String,
  company_name: String,
  location: Object,
  workflow: Object,
  contact: Object,
  user: Object,
  attributionSource: Object,
  customData: Object,
  triggerData: Object
}, { strict: false }); // permite también guardar cualquier campo no definido

module.exports = mongoose.model('CRMBDD', WebhookSchema, 'CRMBDDS');
