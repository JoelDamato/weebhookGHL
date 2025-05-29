const Contacto = require('../models/contacto');
exports.handleWebhook = async (req, res) => {
  console.log('🟡 [DEBUG] Entró al handleWebhook de /webhook');
  try {
    console.log('🟡 [DEBUG] Antes de buscar en Mongo');
    const contacto = await Contacto.findOne({ contact_id: req.body.contact_id });
    console.log('🟡 [DEBUG] Resultado búsqueda en Mongo:', contacto);
    res.status(200).send({ ok: true, mongo: contacto });
  } catch (error) {
    console.error('❌ Error en el try del webhook:', error);
    res.status(500).send({ error: 'Error interno del servidor [debug]' });
  }
};
