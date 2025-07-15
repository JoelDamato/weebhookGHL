const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// Registrar fuente personalizada
registerFont(path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf'), {
  family: 'Riwaya'
});

exports.handleIaWebhookDevolucion = async (req, res) => {
  console.log('🚀 Generando devolución...');

  try {
    const nombre = req.body.nombre || 'Nombre de Prueba';
    const fade = req.body.fade || '';
    const visagismo = req.body.visagismo || '';
    const detalles = req.body.detalles || '';
    const consejo = req.body.consejo || '';
    const imageUrl = 'https://i.ibb.co/xdXwwHg/Devolucio-n1domingo.png';

    console.log('📝 Datos:', { nombre, fade, visagismo, detalles, consejo });

    // Descargar imagen base
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);

    // Crear canvas
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    console.log(`📐 Dimensiones: ${img.width}x${img.height}`);

    // Función para hacer wrap del texto largo
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

    // === Estilo general ===
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';

    // ===== Nombre centrado con fuente Riwaya =====
    ctx.font = '30px "Riwaya"';
    ctx.textAlign = 'center';
    const nombreX = img.width / 2;
    const nombreY = img.height * 0.212;
    ctx.fillText(nombre, nombreX, nombreY);

    // ===== Estilo para bloques de texto también con Riwaya =====
    ctx.font = '22px "Riwaya"';
    ctx.textAlign = 'center';
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
