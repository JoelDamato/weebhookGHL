require('../db'); // conexión MongoDB
const Contacto = require('../models/contacto');
const { createNotionContact, updateNotionContact } = require('../services/notionService');

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

    if (!contacto) {
      // Crear nuevo contacto en MongoDB
      const nuevoContacto = new Contacto(contactoData);
      contactoData._id = String(nuevoContacto._id);

      console.log('[NOTION] Creando contacto en Notion...');
      const notionId = await createNotionContact(contactoData);

      nuevoContacto.notion_id = notionId;
      await nuevoContacto.save();

      console.log('[NOTION] Contacto creado en Notion con ID:', notionId);
      return res.status(200).send({
        message: 'Contacto nuevo creado en MongoDB y Notion',
        notion_id: notionId
      });
    }

    // Actualizar MongoDB con nueva data y obtener contacto actualizado
    contacto = await Contacto.findOneAndUpdate(
      { contact_id },
      { $set: contactoData },
      { new: true }
    );

    let notionId = contacto.notion_id;

    if (notionId) {
      // Intentar actualizar en Notion
      try {
        await updateNotionContact(notionId, contactoData);
        console.log('♻️ Contacto actualizado en MongoDB y Notion');
        return res.status(200).send({
          message: 'Contacto actualizado en MongoDB y Notion',
          notion_id: notionId
        });
      } catch (err) {
        console.warn('⚠️ No se pudo actualizar Notion. Creando nuevo...');

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
      // No tenía notion_id → crearlo y actualizar Mongo
      console.log('➕ Contacto en Mongo no tenía Notion ID. Creando...');
      contactoData._id = String(contacto._id);
      const nuevoNotionId = await createNotionContact(contactoData);

      await Contacto.findOneAndUpdate(
        { contact_id },
        { $set: { notion_id: nuevoNotionId } }
      );

      console.log('✅ Contacto sincronizado con Notion');
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
