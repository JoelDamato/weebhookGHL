const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

exports.handleIaWebhookDevolucion = async (req, res) => {
  console.log('🚀 Generando diploma con Arial (Devolución)...');

  try {
    const nombre = req.body.nombre || 'Nombre de Prueba';
    const devolucion_erick = req.body.devolucion_erick || 'Texto de prueba largo para devolución técnica.';
    const imageUrl = 'https://i.ibb.co/DHNgFvgg/Devolucio-n1-1.png';

    console.log('📝 Datos:', { nombre, devolucion_erick });

    // Descargar imagen base
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);

    // Crear canvas
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    console.log(`📐 Dimensiones: ${img.width}x${img.height}`);

    // ===== Función para hacer wrap del texto largo =====
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

    // ===== Nombre (alineado a la derecha de "Hola") =====
    ctx.fillStyle = 'white';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const holaX = img.width * 0.13; // Coordenada horizontal de "Hola"
    const nombreX = holaX + 300; // Un poco a la derecha
    const nombreY = img.height * 0.212; // Justo debajo de "Hola"

    ctx.fillText(nombre, nombreX, nombreY);

    // ===== Devolución Erick (debajo de "Puntuación del corte:") =====
    ctx.fillStyle = 'white';
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const idX = img.width * 0.12; // Margen izquierdo
    const idY = img.height * 0.40; // Ajustado para estar justo debajo de "Puntuación del corte:"

    wrapText(ctx, `• ${devolucion_erick}`, idX, idY, img.width * 0.75, 36);

    console.log('✅ Completado');

    // Enviar imagen como respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};
