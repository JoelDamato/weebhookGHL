const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

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

    // Estilo general del texto
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // ===== Nombre (debajo de "Jota Damo") =====
    ctx.font = 'bold 34px Arial';
    const nombreX = img.width * 0.13 + 300;
    const nombreY = img.height * 0.212;
    ctx.fillText(nombre, nombreX, nombreY);

    // Estilo para bloques de texto
    ctx.font = '22px Arial';
    const maxWidth = img.width * 0.75;
    const idX = img.width * 0.12;

    // ===== Puntuación del corte =====
    if (fade) {
      wrapText(ctx, `• ${fade}`,  idX + 30, img.height * 0.448, maxWidth, 36);
    }

    // ===== Visagismo =====
    if (visagismo) {
      wrapText(ctx, `• ${visagismo}`, idX + 30, img.height * 0.58, maxWidth, 36);
    }

    // ===== Detalles del corte =====
    if (detalles) {
      wrapText(ctx, `• ${detalles}`, idX + 30, img.height * 0.72, maxWidth, 36);
    }

    // ===== Consejo =====
    if (consejo) {
      wrapText(ctx, `• ${consejo}`, idX + 30, img.height * 0.86, maxWidth, 36);
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
