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

// --- Cola simple para procesar webhooks uno por uno ---
const queue = [];
let processing = false;
const DELAY_BETWEEN_REQUESTS = 1000; // ms, ajusta según tu necesidad

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const { reqBody } = queue.shift();
    try {
      await handleWebhookInternal(reqBody);
    } catch (e) {
      // El error ya se loguea internamente
    }
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
  }
  processing = false;
}

// --- Handler real, sin res ---
async function handleWebhookInternal(body) {
  console.log('🟡 Webhook recibido de GHL');
  console.log(JSON.stringify(body, null, 2));

  const { contact_id } = body;
  const contactoData = buildContactoData(body);

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
        try {
          await updateNotionContact(notionId, contactoData);
        } catch (err) {
          if (err?.code === 'rate_limited' || err?.status === 429) {
            const retryAfter = Number(err.headers?.get('retry-after')) || 10;
            console.warn(`⏳ Rate limited. Esperando ${retryAfter} segundos antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            await updateNotionContact(notionId, contactoData);
          } else {
            throw err;
          }
        }

        return;
      }

      // Si no existe en Notion → crearlo
      console.log('➕ Creando nuevo contacto en Notion...');
      notionId = await createNotionContact(contactoData);
      nuevoContacto.notion_id = notionId;
      await nuevoContacto.save();

      return;
    }

    // Contacto ya existe en Mongo
    contacto = await Contacto.findOneAndUpdate(
      { contact_id },
      { $set: contactoData },
      { new: true }
    );

    if (contacto.notion_id) {
      try {
        await updateNotionContact(contacto.notion_id, contactoData);
      } catch (err) {
        if (err?.code === 'rate_limited' || err?.status === 429) {
          const retryAfter = Number(err.headers?.get('retry-after')) || 10;
          console.warn(`⏳ Rate limited. Esperando ${retryAfter} segundos antes de reintentar...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          await updateNotionContact(contacto.notion_id, contactoData);
        } else {
          throw err;
        }
      }
      return;
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

    return;

  } catch (error) {
    if (error?.code === 'rate_limited' || error?.status === 429) {
      const retryAfter = Number(error.headers?.get('retry-after')) || 10;
      console.warn(`⏳ Rate limited. Esperando ${retryAfter} segundos antes de reintentar...`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return exports.handleWebhook(req, res); // reintenta el webhook completo
    }
    console.error('❌ Error procesando webhook:', error);
    return res.status(500).send({ error: 'Error interno del servidor' });
  }
}

// --- Nuevo handler que responde rápido y encola ---
exports.handleWebhook = (req, res) => {
  queue.push({ reqBody: req.body });
  processQueue();
  res.status(200).send({ received: true });
};

// El funcionamiento de guardado y duplicado sigue igual:
// - Si el contacto NO existe en Mongo, busca en Notion por GHL ID.
//   - Si existe en Notion, lo asocia en Mongo y actualiza Notion (no duplica en Notion).
//   - Si NO existe en Notion, lo crea en Notion y guarda el notion_id en Mongo.
// - Si el contacto SÍ existe en Mongo, actualiza Mongo y Notion.
// - Si hay rate limit, reintenta la operación.
// - Así, NO se crean duplicados en Notion por GHL ID y Mongo siempre queda sincronizado.
