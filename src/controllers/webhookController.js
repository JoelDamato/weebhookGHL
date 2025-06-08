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

    // 1. Buscar contacto en MongoDB usando contact_id (GHL ID)
    let contacto = await Contacto.findOne({ contact_id });
    console.log('[MONGO] Resultado búsqueda en Mongo:', contacto);

    // 2. Si no existe en Mongo, crear nuevo en Mongo y Notion
    if (!contacto) {
      const nuevoContacto = new Contacto(contactoData);
      contactoData._id = String(nuevoContacto._id);

      // Buscar en Notion por ghl_id para evitar duplicados
      let notionId = await findNotionContactByGhlId(contactoData.contact_id);

      if (notionId) {
        // Si existe en Notion, actualizar ese registro
        await updateNotionContact(notionId, contactoData);
        nuevoContacto.notion_id = notionId;
        await nuevoContacto.save();
        return res.status(200).send({
          message: 'Contacto nuevo creado en MongoDB y actualizado en Notion (sin duplicar en Notion)',
          notion_id: notionId
        });
      } else if (nuevoContacto.notion_id) {
        // Si existe notion_id en el nuevo contacto, actualizar en Notion usando ese ID
        await updateNotionContact(nuevoContacto.notion_id, contactoData);
        await nuevoContacto.save();
        return res.status(200).send({
          message: 'Contacto nuevo creado en MongoDB y actualizado en Notion',
          notion_id: nuevoContacto.notion_id
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

    // 3. Si existe en Mongo, actualizar Mongo y luego buscar/actualizar en Notion usando notion_id
    contacto = await Contacto.findOneAndUpdate(
      { contact_id },
      { $set: contactoData },
      { new: true }
    );

    let notionId = contacto.notion_id;

    // 4. Si hay notion_id, actualizar en Notion usando ese notion_id
    if (notionId) {
      try {
        await updateNotionContact(notionId, contactoData);
        return res.status(200).send({
          message: 'Contacto actualizado en MongoDB y Notion',
          notion_id: notionId
        });
      } catch (err) {
        // Manejo específico para error de rate limit de Notion
        if (
          err?.response?.status === 429 ||
          err?.status === 429 ||
          err?.code === 'rate_limited'
        ) {
          // Esperar 2 segundos antes de responder
          await new Promise(resolve => setTimeout(resolve, 2000));
          return res.status(429).send({
            error: 'Rate limited by Notion API',
            details: err?.response?.data || err?.message || err
          });
        }
        // 5. Si falla el update en Notion o no hay notion_id, crear nuevo en Notion y actualizar notion_id en Mongo
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
