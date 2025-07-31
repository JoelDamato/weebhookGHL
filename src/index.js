require('dotenv').config(); // Siempre primero, para cargar variables de entorno
require('./db'); // Conexión MongoDB

const express = require('express');
const bodyParser = require('body-parser');
const webhookController = require('./controllers/webhookController');
const notionWebhookController = require('./controllers/notionWebhookController.js');
const iaWebhookController = require('./controllers/iaWebhookController');
const iaWebhookDevolucionController = require('./controllers/iaWebhookDevolucionController');
const iaWebhookAlejoController = require('./controllers/iaWebhookAlejoController');
const iaWebhookFinalController = require('./controllers/iaWebhookFinalController');
const iaWebhookGptImageController = require('./controllers/iaWebhookGptImageController.js');
const iaWebhookPdfController = require('./controllers/iaWebhookPdfController.js');


const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', webhookController.handleWebhook);
app.post('/webhook/notion', notionWebhookController.handleNotionWebhook);
app.post('/webhook/ia/jota', iaWebhookController.handleIaWebhook);
app.post('/webhook/ia/erick', iaWebhookDevolucionController.handleIaWebhookDevolucion);
app.post('/webhook/ia/alejo', iaWebhookAlejoController.handleIaWebhookAlejo);
app.post('/webhook/ia/final', iaWebhookFinalController.handleIaWebhookFinal);
app.post('/webhook/ia/gpt-image', iaWebhookGptImageController.handleIaWebhookGptImage);
app.post('/webhook/ia/pdf', iaWebhookPdfController.handleIaWebhookPdf);


// Servir archivos estáticos desde /public
app.use('/public', require('express').static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.send('Backend iniciado correctamente');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

