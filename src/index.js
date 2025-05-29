require('./db'); // ✅ conexión a Mongo

const express = require('express');
const bodyParser = require('body-parser');
const webhookController = require('../controllers/webhookController');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Ruta del webhook
app.post('/webhook', webhookController.handleWebhook);

// Ruta simple de prueba
app.get('/', (req, res) => {
  res.send('Backend iniciado correctamente');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});