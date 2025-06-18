exports.handleIaWebhook = (req, res) => {
  console.log('Webhook IA recibido:', req.body);
  res.status(200).json({ ok: true });
};
