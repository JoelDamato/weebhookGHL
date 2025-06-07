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

      // Buscar en Notion por contact_id (GHL ID)
      let notionId = await findNotionContactByGhlId(contactoData.contact_id);

      if (notionId) {
        // Si existe en Notion, actualizarlo
        await updateNotionContact(notionId, contactoData);
        nuevoContacto.notion_id = notionId;
        await nuevoContacto.save();
        return res.status(200).send({
          message: 'Contacto nuevo creado en MongoDB y actualizado en Notion',
          notion_id: notionId
        });
      } else {
        // Si no existe en Notion, crearlo
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

    // --- Nueva lógica de búsqueda en Notion ---
    if (notionId) {
      try {
        await updateNotionContact(notionId, contactoData);
        return res.status(200).send({
          message: 'Contacto actualizado en MongoDB y Notion',
          notion_id: notionId
        });
      } catch (err) {
        // Si falla el update, intentar buscar por contact_id en Notion
        notionId = await findNotionContactByGhlId(contactoData.contact_id);
        if (notionId) {
          await updateNotionContact(notionId, contactoData);
          await Contacto.findOneAndUpdate(
            { contact_id },
            { $set: { notion_id: notionId } }
          );
          return res.status(200).send({
            message: 'Contacto actualizado en Notion por contact_id',
            notion_id: notionId
          });
        } else {
          // Si tampoco existe, crear nuevo en Notion
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
      }
    } else {
      // No tenía notion_id → buscar por contact_id en Notion
      notionId = await findNotionContactByGhlId(contactoData.contact_id);
      if (notionId) {
        await updateNotionContact(notionId, contactoData);
        await Contacto.findOneAndUpdate(
          { contact_id },
          { $set: { notion_id: notionId } }
        );
        return res.status(200).send({
          message: 'Contacto sincronizado con Notion (encontrado por contact_id)',
          notion_id: notionId
        });
      } else {
        // Si no existe, crearlo
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
    }

  } catch (error) {
    console.error('❌ Error al procesar el webhook:', error);
    res.status(500).send({ error: 'Error interno del servidor' });
  }
};
