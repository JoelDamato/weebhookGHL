require('../db'); // conexión MongoDB
const Contacto = require('../models/contacto');
const { createNotionContact, updateNotionContact } = require('../services/notionService');

// Extrae UTM desde plano o anidado
const getUtm = (data, key) => (
  data[key] ||
  data.contact?.attributionSource?.[key]
);

// Devuelve un objeto con los utm normalizados + el resto del body
function buildContactoData(body) {
  return {
    ...body,
    utm_content: getUtm(body, 'utm_content'),
    utm_source: getUtm(body, 'utm_source'),
    fbclid: getUtm(body, 'fbclid'),
    utm_campaign: getUtm(body, 'utm_campaign'),
    utm_term: getUtm(body, 'utm_term'),
    utm_medium:
      getUtm(body, 'utm_medium') ||
      body.contact?.attributionSource?.medium,
  };
}

exports.handleWebhook = async (req, res) => {
  console.log('🟡 [DEBUG] Entró al handleWebhook de /webhook');
  console.log('📩 Webhook recibido desde GHL:');
  console.log(JSON.stringify(req.body, null, 2));

  const { contact_id } = req.body;
  try {
    // 1. PREPROCESAR LOS UTM
    const contactoData = buildContactoData(req.body);

    // 2. Buscar en Mongo
    let contacto = await Contacto.findOne({ contact_id });
    console.log('[MONGO] Resultado búsqueda en Mongo:', contacto);

    if (!contacto) {
      // 🆕 Crear en Mongo y Notion
      const nuevoContacto = new Contacto(contactoData);
      await nuevoContacto.save();
      console.log('[NOTION] Intentando crear en Notion...');

      // Crear en Notion y guardar el ID
      const notionId = await createNotionContact(contactoData);
      nuevoContacto.notion_id = notionId;
      await nuevoContacto.save();
      console.log('[NOTION] Creado en Notion con ID:', notionId);

      return res.status(200).send({ message: 'Contacto nuevo creado en MongoDB y Notion', notion_id: notionId });
    } else {
      // ♻️ Actualizar Mongo y Notion
      await Contacto.findOneAndUpdate({ contact_id }, { $set: contactoData });

      // Si tiene notion_id, actualizar en Notion; si no, crear y guardar el ID
      let notionId = contacto.notion_id;
      if (notionId) {
        await updateNotionContact(notionId, contactoData);
        console.log('♻️ Contacto actualizado en MongoDB y Notion');
        return res.status(200).send({ message: 'Contacto actualizado en MongoDB y Notion', notion_id: notionId });
      } else {
        notionId = await createNotionContact(contactoData);
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
