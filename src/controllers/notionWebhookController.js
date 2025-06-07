exports.handleNotionWebhook = async (req, res) => {
  try {
    console.log("📩 Webhook recibido desde Notion:");
    console.dir(req.body, { depth: null }); // muestra estructura completa

    res.status(200).json({ success: true, message: "Webhook recibido correctamente" });
  } catch (error) {
    console.error("❌ Error al procesar el webhook:", error.message);
    res.status(500).json({ error: "Error interno al recibir el webhook" });
  }
};