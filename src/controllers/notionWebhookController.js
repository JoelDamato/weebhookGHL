const axios = require("axios");

// Helper para reintentos con delay
async function retryRequest(fn, maxRetries = 5, delayMs = 2000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.response && err.response.status === 429) {
        console.warn(`⏳ Rate limit alcanzado. Reintentando en ${delayMs}ms... (${i + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delayMs));
        lastError = err;
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// --- Cola simple para procesar webhooks uno por uno ---
const queue = [];
let processing = false;
const DELAY_BETWEEN_REQUESTS = 1500; // ms (ajusta según tu necesidad)

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length > 0) {
    const { req, res, next } = queue.shift();
    try {
      await handleNotionWebhookInternal(req, res, next);
    } catch (e) {
      // Ya maneja el error internamente
    }
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
  }
  processing = false;
}

// --- Tu handler original, renombrado ---
async function handleNotionWebhookInternal(req, res, next) {
  try {
    console.log("📥 Webhook recibido desde Notion:");
    console.dir(req.body, { depth: null });

    const data = req.body?.data;
    const properties = data?.properties;
    const GHL_API_TOKEN = process.env.GOHIGHLEVEL_API_KEY;

    // Utils
    const getRichText = (field) => {
      const value = properties?.[field]?.rich_text?.[0]?.plain_text || null;
      console.log(`🔍 ${field} (rich_text):`, value);
      return value;
    };

    const getTitle = () => {
      const value = properties?.["Nombre completo"]?.title?.[0]?.plain_text || null;
      console.log("🔍 Nombre completo (title):", value);
      return value;
    };

    const getPhone = () => {
      const value = properties?.["Telefono"]?.phone_number || null;
      console.log("🔍 Telefono:", value);
      return value;
    };

    const getEmail = () => {
      const value = properties?.["Mail"]?.email || null;
      console.log("🔍 Mail:", value);
      return value;
    };

    const getSelect = (field) => {
      const value = properties?.[field]?.select?.name || null;
      console.log(`🔍 ${field} (select):`, value);
      return value;
    };

    const getMultiSelect = (field) => {
      const value = properties?.[field]?.multi_select?.map((item) => item.name).join(", ") || null;
      console.log(`🔍 ${field} (multi_select):`, value);
      return value;
    };

    const getGhlId = () => {
      const value = properties?.["ghl_id"]?.rich_text?.[0]?.plain_text || null;
      console.log("🔍 GHL ID:", value);
      return value;
    };

    // Campos básicos
    const nombre = getRichText("Nombre");
    const apellido = getRichText("Apellido");
    const nombreCompleto = getTitle();
    const telefono = getPhone();
    const email = getEmail();
    const ghlId = getGhlId();

    // UTM + segmentación
    const utm_source = getRichText("utm_source");
    const utm_medium = getRichText("utm_medium");
    const utm_campaign = getRichText("utm_campaign");
    const utm_term = getRichText("utm_term");
    const utm_content = getRichText("utm_content");
    const fbclid = getRichText("fbclid");

    // Personalizados (usando IDs reales)
    const embudo = getSelect("Embudo_1");
    const mensualidad = getMultiSelect("Mensualidad");
    const estrategia = getMultiSelect("Estrategia");
    const productos = getMultiSelect("Productos_adquiridos");
    const subProductos = getMultiSelect("Sub_productos");
    const recursos = getMultiSelect("Recursos");
    const temperatura = getSelect("Temperatura");

    if (!ghlId) {
      console.warn("⚠️ No se recibió ghl_id, no se puede actualizar.");
      return res.status(400).json({ error: "Falta ghl_id para actualizar contacto." });
    }

    const body = {
      email,
      phone: telefono,
      firstName: nombre || "",
      lastName: apellido || "",
      utmSource: utm_source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
      utmTerm: utm_term,
      utmContent: utm_content,
      fbclid: fbclid,
      customField: [
        { id: "LqNrc2iiYFgZB8UdW3L6", value: embudo || "" },
        { id: "NWI5HRjOu8aa8dD76kPS", value: mensualidad || "" },
        { id: "8iPPm28N2l5HV94UeK28", value: estrategia || "" },
        { id: "5OLqEbZYm5j95nLs0pcu", value: productos || "" },
        { id: "9OG7VeaubWZFTIQmZsWa", value: subProductos || "" },
        { id: "gc4F2H6uV9OezwglO6Uo", value: recursos || "" },
        { id: "vy2rHZreNVdHWjxALxic", value: temperatura || "" },
        { id: "cdJJCRzElVtnneHPPDhv", value: utm_term },
        { id: "pZ2bIKcQKS8AdpVQS1jc", value: utm_medium },
        { id: "LsczcupSHc2kT623s860", value: utm_campaign },
        { id: "9NcibYaWSp5ciwevtuAw", value: fbclid || "" },
        { id: "hXPfmoL0QAeqYbSiNwNZ", value: utm_source },
        { id: "gq73k4n4NPhXuWuXfOqU", value: utm_content }
      ] // No filtrar, así se envían los vacíos
    };

    console.log("📤 Payload final enviado a GHL:");
    console.dir(body, { depth: null });

    // Usa retryRequest para manejar el rate limit
    const response = await retryRequest(() =>
      axios.put(
        `https://rest.gohighlevel.com/v1/contacts/${ghlId}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${GHL_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      )
    );

    console.log("✅ Contacto actualizado en GoHighLevel:");
    console.dir(response.data, { depth: null });

    return res.status(200).json({
      success: true,
      updated: true,
      ghl_id: ghlId,
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Error al actualizar en GHL:", error.response?.data || error.message);
    return res.status(500).json({ error: "Fallo al actualizar contacto en GoHighLevel" });
  }
}

// --- Nuevo handler que encola las peticiones ---
exports.handleNotionWebhook = (req, res, next) => {
  queue.push({ req, res, next });
  processQueue();
};
