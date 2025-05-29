require('../db'); // conexión MongoDB
const Contacto = require('../models/contacto');
const { createNotionContact, updateNotionContact } = require('../services/notionService');

exports.handleWebhook = async (req, res) => {
  console.log('📩 Webhook recibido desde GHL:');
  console.log(JSON.stringify(req.body, null, 2));

  const { contact_id } = req.body;

  try {
    let contacto = await Contacto.findOne({ contact_id });

    if (!contacto) {
      // 🆕 No existe, crear en Mongo y en Notion
      const nuevoContacto = new Contacto(req.body);
      await nuevoContacto.save();

      // Crear en Notion y guardar el ID
      const notionId = await createNotionContact(req.body);
      nuevoContacto.notion_id = notionId;
      await nuevoContacto.save();

      console.log('✅ Contacto nuevo creado en MongoDB y Notion');
      return res.status(200).send({ message: 'Contacto nuevo creado en MongoDB y Notion', notion_id: notionId });
    } else {
      // ♻️ Ya existe, actualizar Mongo y Notion
      await Contacto.findOneAndUpdate({ contact_id }, { $set: req.body });

      // Si tiene notion_id, actualizar en Notion; si no, crear en Notion y guardar el ID
      let notionId = contacto.notion_id;
      if (notionId) {
        await updateNotionContact(notionId, req.body);
        console.log('♻️ Contacto actualizado en MongoDB y Notion');
        return res.status(200).send({ message: 'Contacto actualizado en MongoDB y Notion', notion_id: notionId });
      } else {
        // Si existe en Mongo pero no tiene notion_id (caso raro)
        notionId = await createNotionContact(req.body);
        await Contacto.findOneAndUpdate({ contact_id }, { $set: { notion_id: notionId } });
        console.log('✅ Contacto actualizado en Mongo y creado en Notion');
        return res.status(200).send({ message: 'Contacto sincronizado con Notion', notion_id: notionId });
      }
    }
  } catch (error) {
    console.error('❌ Error al procesar el webhook:', error);
    res.status(500).send({ error: 'Error interno del servidor' });
  }
};
