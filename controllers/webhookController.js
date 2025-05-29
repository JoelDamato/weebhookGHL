require('../src/db'); // conecta Mongo apenas se llama este archivo
const Contacto = require('../models/Contacto');

exports.handleWebhook = async (req, res) => {
  console.log('📩 Webhook recibido desde GHL:');
  console.log(JSON.stringify(req.body, null, 2));

  const { contact_id } = req.body;

  try {
    const contactoExistente = await Contacto.findOne({ contact_id });

    if (contactoExistente) {
      console.log('⚠️ Ya existe este contacto en la base de datos');
      return res.status(200).send({ message: 'Contacto ya registrado' });
    }

    const nuevoContacto = new Contacto(req.body);
    await nuevoContacto.save();

    console.log('✅ Contacto guardado en MongoDB');
    res.status(200).send({ message: 'Contacto nuevo guardado' });
  } catch (error) {
    console.error('❌ Error al procesar el webhook:', error);
    res.status(500).send({ error: 'Error interno del servidor' });
  }
};
