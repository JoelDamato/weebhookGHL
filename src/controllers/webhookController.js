const Contacto = require('../models/contacto');
require('../db');

exports.handleWebhook = async (req, res) => {
  console.log('📩 Webhook recibido desde GHL:');
  console.log(JSON.stringify(req.body, null, 2));

  const { contact_id } = req.body;

  try {
    const resultado = await Contacto.findOneAndUpdate(
      { contact_id },
      { $set: req.body },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Verificamos si fue creado o actualizado
    const yaExistía = await Contacto.exists({ contact_id });
    if (yaExistía) {
      console.log('♻️ Contacto actualizado en MongoDB');
      return res.status(200).send({ message: 'Contacto actualizado' });
    }

    console.log('✅ Contacto nuevo guardado en MongoDB');
    res.status(200).send({ message: 'Contacto nuevo guardado' });

  } catch (error) {
    console.error('❌ Error al procesar el webhook:', error);
    res.status(500).send({ error: 'Error interno del servidor' });
  }
};
