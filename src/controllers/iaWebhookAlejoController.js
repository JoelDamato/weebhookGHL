const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// Registrar la fuente
const fontPath = path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf');
try {
  console.log('🔤 Registrando fuente:', fontPath);
  registerFont(fontPath, { family: 'Riwaya' });
} catch (error) {
  console.error('❌ Error registrando fuente:', error);
}

// Función para probar fuentes
function tryFont(ctx, fontName, size, weight = '') {
  try {
    const fullFont = `${weight} ${size}px "${fontName}"`.trim();
    ctx.font = fullFont;
    console.log(`✅ Fuente aplicada: ${fullFont}`);
    return true;
  } catch (error) {
    console.log(`❌ Error con fuente: ${fontName}`);
    return false;
  }
}

// Ajustar texto con saltos de línea
function wrapTextMultiline(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
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
      lines.push('');
    }
  }

  return lines;
}

// Setear fuente con fallback
function setFont(ctx, size = 22, weight = '') {
  const fontNames = ['Riwaya'];
  for (const fontName of fontNames) {
    if (tryFont(ctx, fontName, size, weight)) return;
  }
  ctx.font = `${weight} ${size}px Arial`.trim();
}

exports.handleIaWebhookAlejo = async (req, res) => {
  console.log('🚀 Generando diploma para Alejo...');

  try {
    const devolucion = req.body.devolucion || '';
    const consejo = req.body.consejo || '';
    const puntos = req.body.puntos || '';
    const devolucion_teorica = req.body.devolucion_teorica || '';
    const consejo_teorica = req.body.consejo_teorica || '';
    const puntos_teorica = req.body.puntos_teorica || '';
    const imageUrl = 'https://i.ibb.co/qYDBrcRt/alejodomingo.png';

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);

    // POSICIONES
    const devX = img.width * 0.10;
    const maxWidth = img.width * 0.84;
    const lineHeight = 30;
    const teoricaLineHeight = 30;
    const teoricaMaxWidth = img.width * 0.80;

    // COORDENADAS
    const puntosY = img.height * 0.238;
    const devolucionY = img.height * 0.26;
    const consejoY = img.height * 0.42;

    const puntosTeoricaY = img.height * 0.619;
    const devolucionTeoricaY = img.height * 0.64;
    const consejoTeoricaY = img.height * 0.82;

    const puntosX = img.width * 0.25;
    const devolucionX = devX;
    const consejoX = devX;
    const puntosTeoricaX = img.width * 0.30;
    const devolucionTeoricaX = devX;
    const consejoTeoricaX = devX;

    // ANCHOS
    const maxWidthDevolucion = maxWidth;
    const maxWidthConsejo = maxWidth;
    const maxWidthDevolucionTeorica = teoricaMaxWidth;
    const maxWidthConsejoTeorica = teoricaMaxWidth;

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // PUNTOS PRÁCTICOS
    if (puntos) {
      setFont(ctx, 22);
      ctx.fillText(`${puntos}`, puntosX, puntosY);
    }

    // DEVOLUCIÓN PRÁCTICA
    if (devolucion) {
      setFont(ctx, 22);
      let currentY = devolucionY;
      const devolucionLines = wrapTextMultiline(ctx, devolucion, maxWidthDevolucion);
      devolucionLines.forEach((line, index) => {
        ctx.fillText(line, devolucionX, currentY + (index * lineHeight));
      });
    }

    // CONSEJO PRÁCTICO
    if (consejo) {
      setFont(ctx, 22);
      let currentY = consejoY;
      const consejoLines = wrapTextMultiline(ctx, consejo, maxWidthConsejo);
      consejoLines.forEach((line, index) => {
        ctx.fillText(line, consejoX, currentY + (index * lineHeight));
      });
    }

    // PUNTOS TEÓRICOS
    if (puntos_teorica) {
      setFont(ctx, 22);
      ctx.fillText(`${puntos_teorica}`, puntosTeoricaX, puntosTeoricaY);
    }

    // DEVOLUCIÓN TEÓRICA
    if (devolucion_teorica) {
      setFont(ctx, 22);
      let currentY = devolucionTeoricaY;
      const devolucionTeoricaLines = wrapTextMultiline(ctx, devolucion_teorica, maxWidthDevolucionTeorica);
      devolucionTeoricaLines.forEach((line, index) => {
        ctx.fillText(line, devolucionTeoricaX, currentY + (index * teoricaLineHeight));
      });
    }

    // CONSEJO TEÓRICO
    if (consejo_teorica) {
      setFont(ctx, 22);
      let currentY = consejoTeoricaY;
      const consejoTeoricaLines = wrapTextMultiline(ctx, consejo_teorica, maxWidthConsejoTeorica);
      consejoTeoricaLines.forEach((line, index) => {
        ctx.fillText(line, consejoTeoricaX, currentY + (index * teoricaLineHeight));
      });
    }

    console.log('✅ Diploma generado correctamente');
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};
