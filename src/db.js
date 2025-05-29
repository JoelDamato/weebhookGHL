const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  dbName: 'ghl_webhooks', // asegúrate de que coincida con el nombre de tu DB
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🟢 MongoDB conectado correctamente'))
.catch(err => console.error('🔴 Error al conectar con MongoDB:', err));
