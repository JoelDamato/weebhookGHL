const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// 1. MOVER LA FUNCIÓN HELPER AFUERA
// Es más eficiente definirla una sola vez a nivel de módulo.
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
    y += lineHeight + 10; // espacio extra entre párrafos
  }
}


exports.handleIaWebhookDevolucion = async (req, res) => {
  console.log('🚀 Generando devolución...');

  try {
    // 2. MOVER Y CORREGIR EL REGISTRO DE LA FUENTE
    // La ruta '..' es correcta si este archivo está en 'src/controllers'.
    const fontPath = path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf');
    // Se usa el nombre de familia correcto '29LT Riwaya'.
    registerFont(fontPath, { family: '29LT Riwaya' });
    console.log(`🔤 Fuente registrada: '29LT Riwaya'`);


    const {
      nombre = 'Nombre de Prueba',
      fade = '',
      visagismo = '',
      detalles = '',
      consejo = ''
    } = req.body;
    const imageUrl = 'https://i.ibb.co/xdXwwHg/Devolucio-n1domingo.png';

    // Descargar imagen base
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);

    // Crear canvas
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // === Estilo general ===
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    // 3. USAR EL NOMBRE DE FAMILIA CORRECTO AL APLICAR LA FUENTE
    // ===== Nombre centrado =====
    ctx.font = '30px "29LT Riwaya"';
    ctx.fillText(nombre, img.width / 2, img.height * 0.212);

    // ===== Estilo para bloques de texto =====
    ctx.font = '22px "29LT Riwaya"';
    const centerX = img.width / 2;
    const maxWidth = img.width * 0.75;

    // ===== Puntuación del corte (Fade) =====
    if (fade) {
      wrapText(ctx, `• ${fade}`, centerX, img.height * 0.447, maxWidth, 36);
    }
    // ===== Visagismo =====
    if (visagismo) {
      wrapText(ctx, `• ${visagismo}`, centerX, img.height * 0.591, maxWidth, 36);
    }
    // ===== Detalles del corte =====
    if (detalles) {
      wrapText(ctx, `• ${detalles}`, centerX, img.height * 0.729, maxWidth, 36);
    }
    // ===== Consejo =====
    if (consejo) {
      wrapText(ctx, `• ${consejo}`, centerX, img.height * 0.867, maxWidth, 36);
    }

    console.log('✅ Devolución generada correctamente');

    // Enviar imagen como respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error al generar la devolución:', error);
    res.status(500).json({ error: 'Error generando devolución' });
  }
};