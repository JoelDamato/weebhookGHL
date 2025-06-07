require('../db'); // Conexión a MongoDB
const Contacto = require('../models/contacto');
const { createNotionContact, updateNotionContact, findNotionContactByGhlId } = require('../services/notionService');

// Extrae UTM desde plano o anidado
const getUtm = (data, key) => (
  data[key] ||
  data.contact?.attributionSource?.[key]
);

// Devuelve un objeto con los UTM normalizados + el resto del body
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

  // Mostrar campos personalizados (custom fields)
  const customFields = req.body?.customField || req.body?.contact?.customField;
  if (customFields && typeof customFields === 'object') {
    console.log('🧠 Custom Fields recibidos desde GHL:');
    for (const [fieldId, value] of Object.entries(customFields)) {
      console.log(`→ ${fieldId}: ${value}`);
    }
  } else {
    console.log('⚠️ No se encontraron campos personalizados en el webhook.');
  }

  const { contact_id } = req.body;

  try {
    const contactoData = buildContactoData(req.body);

    // Buscar contacto en MongoDB
    let contacto = await Contacto.findOne({ contact_id });
    console.log('[MONGO] Resultado búsqueda en Mongo:', contacto);

    // Si no existe en Mongo, crear nuevo en Mongo y Notion
    if (!contacto) {
      const nuevoContacto = new Contacto(contactoData);
      contactoData._id = String(nuevoContacto._id);

      // Buscar en Notion por notion_id (si existe en el nuevo contacto)
      let notionId = nuevoContacto.notion_id;

      if (notionId) {
        // Si existe notion_id, actualizar en Notion usando ese ID
        await updateNotionContact(notionId, contactoData);
        nuevoContacto.notion_id = notionId;
        await nuevoContacto.save();
        return res.status(200).send({
          message: 'Contacto nuevo creado en MongoDB y actualizado en Notion',
          notion_id: notionId
        });
      } else {
        // Si no existe notion_id, crearlo en Notion
        notionId = await createNotionContact(contactoData);
        nuevoContacto.notion_id = notionId;
        await nuevoContacto.save();
        return res.status(200).send({
          message: 'Contacto nuevo creado en MongoDB y Notion',
          notion_id: notionId
        });
      }
    }

    // Actualizar MongoDB con nueva data y obtener contacto actualizado
    contacto = await Contacto.findOneAndUpdate(
      { contact_id },
      { $set: contactoData },
      { new: true }
    );

    let notionId = contacto.notion_id;

    // --- Siempre buscar y actualizar en Notion usando notion_id de Mongo ---
    if (notionId) {
      try {
        await updateNotionContact(notionId, contactoData);
        return res.status(200).send({
          message: 'Contacto actualizado en MongoDB y Notion',
          notion_id: notionId
        });
      } catch (err) {
        // Si falla el update, crear nuevo en Notion y actualizar notion_id en Mongo
        contactoData._id = String(contacto._id);
        const nuevoNotionId = await createNotionContact(contactoData);
        await Contacto.findOneAndUpdate(
          { contact_id },
          { $set: { notion_id: nuevoNotionId } }
        );
        return res.status(200).send({
          message: 'Se creó nuevo contacto en Notion porque el anterior falló',
          notion_id: nuevoNotionId
        });
      }
    } else {
      // No tenía notion_id → crear nuevo en Notion
      contactoData._id = String(contacto._id);
      const nuevoNotionId = await createNotionContact(contactoData);
      await Contacto.findOneAndUpdate(
        { contact_id },
        { $set: { notion_id: nuevoNotionId } }
      );
      return res.status(200).send({
        message: 'Contacto sincronizado con Notion',
        notion_id: nuevoNotionId
      });
    }

  } catch (error) {
    console.error('❌ Error al procesar el webhook:', error);
    res.status(500).send({ error: 'Error interno del servidor' });
  }
};
