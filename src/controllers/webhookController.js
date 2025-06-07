const axios = require("axios");

exports.handleNotionWebhook = async (req, res) => {
  try {
    const data = req.body?.data;
    const properties = data?.properties;
    const GHL_API_TOKEN = process.env.GOHIGHLEVEL_API_KEY;

    // Utils
    const getRichText = (field) =>
      properties?.[field]?.rich_text?.[0]?.plain_text || null;

    const getTitle = () =>
      properties?.["Nombre completo"]?.title?.[0]?.plain_text || null;

    const getPhone = () => properties?.["Telefono"]?.phone_number || null;
    const getEmail = () => properties?.["Mail"]?.email || null;
    const getSelect = (field) => properties?.[field]?.select?.name || null;
    const getMultiSelect = (field) =>
      properties?.[field]?.multi_select?.map((item) => item.name).join(", ") || null;
    const getGhlId = () =>
      properties?.["ghl_id"]?.rich_text?.[0]?.plain_text || null;

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

    // Personalizados (selects y multi-selects)
    const embudo = getSelect("Embudo_1");
    const mensualidad = getMultiSelect("Mensualidad");
    const estrategia = getMultiSelect("Estrategia");
    const productos = getMultiSelect("Productos_adquiridos");
    const subProductos = getMultiSelect("Sub_productos");
    const recursos = getMultiSelect("Recursos");
    const temperatura = getSelect("Temperatura");

    if (!ghlId) {
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
        { name: "Embudo_1", value: embudo },
        { name: "Mensualidad", value: mensualidad },
        { name: "Estrategia", value: estrategia },
        { name: "Productos_adquiridos", value: productos },
        { name: "Sub_productos", value: subProductos },
        { name: "Recursos", value: recursos },
        { name: "Temperatura", value: temperatura },
      ],
    };

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
    console.error("❌ Error al actualizar en GHL:", error.message);
    return res.status(500).json({ error: "Fallo al actualizar contacto en GoHighLevel" });
  }
};
