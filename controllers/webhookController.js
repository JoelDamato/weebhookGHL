// Controlador para manejar el webhook
exports.handleWebhook = (req, res) => {
  try {
    const data = req.body;
    console.log('📩 Webhook recibido:', data);

    // Lógica de procesamiento...
    // Ejemplo: guardar en base de datos, enviar respuesta, etc.

    res.status(200).send({ message: 'Webhook recibido con éxito' });
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).send({ error: 'Error procesando webhook' });
  }
};
