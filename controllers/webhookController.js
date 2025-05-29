exports.handleWebhook = (req, res) => {
  console.log('📩 Webhook recibido desde GHL:');
  console.log(JSON.stringify(req.body, null, 2)); // imprime el JSON bonito

  res.status(200).send({ message: 'Webhook recibido correctamente' });
};
