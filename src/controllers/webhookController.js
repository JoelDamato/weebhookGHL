const { createNotionContact } = require('../services/notionService');
exports.handleWebhook = async (req, res) => {
  console.log('🟡 [DEBUG] Entró al handleWebhook de /webhook');
  try {
    console.log('🟡 [DEBUG] Antes de crear en Notion');
    const notionId = await createNotionContact(req.body);
    console.log('🟢 [DEBUG] Notion ID:', notionId);
    res.status(200).send({ ok: true, notionId });
  } catch (error) {
    console.error('❌ Error en el try del webhook:', error);
    res.status(500).send({ error: 'Error interno del servidor [debug]' });
  }
};
