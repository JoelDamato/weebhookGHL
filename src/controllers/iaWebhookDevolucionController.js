const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// === Función helper para envolver texto ===
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');
  for (let para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
    y += lineHeight + 10;
  }
}

exports.handleIaWebhookDevolucion = async (req, res) => {
  console.log('🚀 Generando devolución...');

  try {
    // === Registrar fuente ===
    const fontPath = path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf');
    registerFont(fontPath, { family: '29LT Riwaya' });

    // === Recibir variables del cuerpo ===
    const {
      nombre = '',
      fade = '',
      visagismo = '',
      detalles = '',
      consejo = '',
      puntuacion = ''
    } = req.body;

    const imageUrl = 'https://i.ibb.co/Kzhs8yZC/Devolucio-n-1-de-3-viernes.png';

    // === Cargar imagen base ===
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);

    // === Crear canvas ===
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // === Estilo general de texto ===
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';

    // === Nombre centrado ===
    ctx.textAlign = 'center';
    ctx.font = '30px "29LT Riwaya"';
    ctx.fillText(nombre, img.width / 2, img.height * 0.212);

    // === Texto alineado a la izquierda con márgenes fijos de 72px ===
    ctx.textAlign = 'left';
    ctx.font = '26px "29LT Riwaya"';
    const leftX = 72;
    const maxWidth = img.width - 144; // 72px de cada lado

    if (fade) wrapText(ctx, fade, leftX, img.height * 0.369, maxWidth, 36);
    if (visagismo) wrapText(ctx, visagismo, leftX, img.height * 0.491, maxWidth, 36);
    if (detalles) wrapText(ctx, detalles, leftX, img.height * 0.611, maxWidth, 36);
    if (consejo) wrapText(ctx, consejo, leftX, img.height * 0.737, maxWidth, 36);

    // === Puntuación final centrada y dorada ===
    if (puntuacion) {
      ctx.textAlign = 'center';
      ctx.font = '80px "29LT Riwaya"';
      ctx.fillStyle = '#ffffff'; 
      ctx.fillText(`${puntuacion}`, img.width / 2, img.height * 0.840);
      ctx.fillStyle = 'white'; 
    }

    console.log('✅ Devolución generada correctamente');
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error al generar la devolución:', error);
    res.status(500).json({ error: 'Error generando devolución' });
  }
};
