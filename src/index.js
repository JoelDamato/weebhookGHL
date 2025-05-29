require('./db'); // conexión MongoDB

const express = require('express');
const bodyParser = require('body-parser');
const webhookController = require('./controllers/webhookController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para leer JSON
app.use(bodyParser.json());

// Ruta para recibir webhooks
app.post('/webhook', webhookController.handleWebhook);

// Ruta simple de prueba
app.get('/', (req, res) => {
  res.send('Backend iniciado correctamente');
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
