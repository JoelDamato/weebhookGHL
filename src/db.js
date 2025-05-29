const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config(); // Carga las variables del archivo .env

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('🟢 MongoDB conectado correctamente'))
  .catch(err => console.error('🔴 Error al conectar con MongoDB:', err));
