exports.handleWebhook = async (req, res) => {
  console.log('🟡 [DEBUG] Entró al handleWebhook de /webhook');
  try {
    res.status(200).send({ ok: true, msg: "Respondió rápido para test" }); // <<--- responde rápido
  } catch (error) {
    console.error('❌ Error en el try del webhook:', error);
    res.status(500).send({ error: 'Error interno del servidor [debug]' });
  }
};
