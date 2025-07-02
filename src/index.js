require('dotenv').config(); // Siempre primero, para cargar variables de entorno
require('./db'); // Conexión MongoDB

const express = require('express');
const bodyParser = require('body-parser');
const webhookController = require('./controllers/webhookController');
const notionWebhookController = require('./controllers/notionWebhookController.js');
const iaWebhookController = require('./controllers/iaWebhookController');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', webhookController.handleWebhook);
app.post('/webhook/notion', notionWebhookController.handleNotionWebhook);
app.post('/webhook/ia/jota', iaWebhookController.handleIaWebhook);

// Servir archivos estáticos desde /public
app.use('/public', require('express').static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.send('Backend iniciado correctamente');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

