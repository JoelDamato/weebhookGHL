const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

exports.handleIaWebhook = async (req, res) => {
  try {
    const texto = req.body.texto || 'test';
    const imageUrl = 'https://i.ibb.co/nM9SBPrv/Diploma-Mf-3-0.png';

    // Descarga la imagen base como arraybuffer
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Carga imagen en canvas
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Dibuja imagen base
    ctx.drawImage(img, 0, 0);

    // Configura texto en rojo y tamaño
    ctx.fillStyle = 'red';
    ctx.font = 'bold 48px Arial';

    // Dibuja texto arriba (podés cambiar coordenadas para centrar o donde quieras)
    ctx.fillText(texto, 50, 60);

    // Configura respuesta con tipo imagen PNG
    res.set('Content-Type', 'image/png');

    // Envía el stream de la imagen como respuesta
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('Error generando imagen:', error);
    res.status(500).json({ error: 'Error generando imagen' });
  }
};
