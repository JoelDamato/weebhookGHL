const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🟢 MongoDB conectado correctamente'))
.catch(err => console.error('🔴 Error al conectar con MongoDB:', err));
