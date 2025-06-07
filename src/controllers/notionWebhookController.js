const axios = require("axios");

exports.handleNotionWebhook = async (req, res) => {
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

    // Personalizados (validados uno por uno)
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
      firstName: nombre || nombreCompleto,
      lastName: apellido || "",
      utmSource: utm_source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
      utmTerm: utm_term,
      utmContent: utm_content,
      fbclid: fbclid,
      customField: [
        { name: "Embudo 1", value: embudo },
        { name: "Mensualidad", value: mensualidad },
        { name: "Estrategia", value: estrategia },
        { name: "Productos adquiridos", value: productos },
        { name: "Sub productos", value: subProductos },
        { name: "Recursos", value: recursos },
        { name: "Temperatura", value: temperatura },
      ],
    };

    console.log("📤 Payload preparado para GoHighLevel:");
    console.dir(body, { depth: null });

    const response = await axios.put(
      `https://rest.gohighlevel.com/v1/contacts/${ghlId}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${GHL_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Contacto actualizado en GoHighLevel:", response.data);

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
};
