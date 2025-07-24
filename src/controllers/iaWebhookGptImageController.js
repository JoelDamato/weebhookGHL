const axios = require("axios");

exports.handleIaWebhookGptImage = async (req, res) => {
  const { imageUrl, prompt } = req.body;

  if (!imageUrl || !prompt) {
    return res.status(400).json({ respuesta: "Faltan datos: imagenUrl o prompt." });
  }

  try {
    const gptRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "auto"
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = gptRes.data.choices?.[0]?.message?.content || "Sin respuesta del modelo.";
    return res.json({ respuesta: content });
  } catch (error) {
    console.error("❌ Error al llamar a OpenAI:", error.response?.data || error.message);
    return res.status(500).json({ respuesta: "Error al procesar con OpenAI." });
  }
};
