const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

// Función mejorada para ajustar texto y respetar saltos de línea
function wrapTextMultiline(ctx, text, maxWidth) {
  const paragraphs = text.split('\n'); // dividir en párrafos por salto de línea
  const lines = [];

  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(' ');
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;

      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    lines.push(currentLine);
    if (p < paragraphs.length - 1) {
      lines.push(''); // línea vacía entre párrafos
    }
  }

  return lines;
}

exports.handleIaWebhookAlejo = async (req, res) => {
  console.log('🚀 Generando diploma para Alejo...');

  try {
    const devolucion_alejo = req.body.devolucion_alejo || 'Alejo';
    const devolucion_teorica = req.body.devolucion_teorica || 'Teórica';
    const imageUrl = 'https://i.ibb.co/G4qdhZ6s/alejo.png';

    console.log('📝 Datos:', { devolucion_alejo, devolucion_teorica });

    // Descargar imagen base
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    console.log(`📐 Dimensiones: ${img.width}x${img.height}`);

    // Dibujar imagen base
    ctx.drawImage(img, 0, 0);

    // ===== Estilos de texto =====
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // ===== Devolución Alejo =====
    const alejoX = img.width * 0.10;
    const alejoY = img.height * 0.27;
    const maxWidth = img.width * 0.84;
    const alejoLines = wrapTextMultiline(ctx, devolucion_alejo, maxWidth);
    const lineHeight = 25;

    alejoLines.forEach((line, index) => {
      ctx.fillText(line, alejoX, alejoY + (index * lineHeight));
    });

    // ===== Devolución Teórica =====
    ctx.font = '16px Arial';
    const teoricaX = img.width * 0.12;
    const teoricaY = img.height * 0.74;
    const teoricaMaxWidth = img.width * 0.80;
    const teoricaLines = wrapTextMultiline(ctx, devolucion_teorica, teoricaMaxWidth);
    const teoricaLineHeight = 22;

    teoricaLines.forEach((line, index) => {
      ctx.fillText(line, teoricaX, teoricaY + (index * teoricaLineHeight));
    });

    console.log('✅ Diploma generado correctamente');

    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};
