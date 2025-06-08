require('../db');
const Contacto = require('../models/contacto');
const { createNotionContact, updateNotionContact, findNotionContactByGhlId } = require('../services/notionService');

function getUtm(data, key) {
  return data[key] || data.contact?.attributionSource?.[key];
}

function buildContactoData(body) {
  return {
    ...body,
    utm_content: getUtm(body, 'utm_content'),
    utm_source: getUtm(body, 'utm_source'),
    fbclid: getUtm(body, 'fbclid'),
    utm_campaign: getUtm(body, 'utm_campaign'),
    utm_term: getUtm(body, 'utm_term'),
    utm_medium: getUtm(body, 'utm_medium') || body.contact?.attributionSource?.medium,
  };
}

exports.handleWebhook = async (req, res) => {
  console.log('🟡 Webhook recibido');
  console.log(JSON.stringify(req.body, null, 2));

  const { contact_id } = req.body;
  const contactoData = buildContactoData(req.body);

  try {
    let contacto = await Contacto.findOne({ contact_id });

    if (!contacto) {
      console.log('🔍 Contacto no existe en Mongo, verificando en Notion por GHL ID...');

      // Buscar por GHL ID en Notion
      let notionId = await findNotionContactByGhlId(contact_id);

      const nuevoContacto = new Contacto(contactoData);
      contactoData._id = String(nuevoContacto._id);

      if (notionId) {
        console.log('🔁 Contacto ya existe en Notion. Asociando en Mongo...');
        nuevoContacto.notion_id = notionId;
        await nuevoContacto.save();

        // Actualizar Notion por si llegaron nuevos datos
        await updateNotionContact(notionId, contactoData);

        return res.status(200).send({
          message: 'Contacto vinculado a Notion existente y guardado en Mongo',
          notion_id: notionId
        });
      }

      // Si no existe en Notion → crearlo
      console.log('➕ Creando nuevo contacto en Notion...');
      notionId = await createNotionContact(contactoData);
      nuevoContacto.notion_id = notionId;
      await nuevoContacto.save();

      return res.status(200).send({
        message: 'Contacto nuevo creado en MongoDB y Notion',
        notion_id: notionId
      });
    }

    // Contacto ya existe en Mongo
    contacto = await Contacto.findOneAndUpdate(
      { contact_id },
      { $set: contactoData },
      { new: true }
    );

    if (contacto.notion_id) {
      await updateNotionContact(contacto.notion_id, contactoData);
      return res.status(200).send({
        message: 'Contacto actualizado en MongoDB y Notion',
        notion_id: contacto.notion_id
      });
    }

    // Tenía Mongo pero no tenía Notion
    console.log('📭 Contacto en Mongo sin Notion ID. Creando en Notion...');
    const nuevoNotionId = await createNotionContact({
      ...contactoData,
      _id: String(contacto._id)
    });

    await Contacto.findOneAndUpdate(
      { contact_id },
      { $set: { notion_id: nuevoNotionId } }
    );

    return res.status(200).send({
      message: 'Contacto sincronizado con nuevo registro en Notion',
      notion_id: nuevoNotionId
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return res.status(500).send({ error: 'Error interno del servidor' });
  }
};
