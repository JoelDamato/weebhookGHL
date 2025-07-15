const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// 1. ELIMINAMOS EL REGISTRO GLOBAL DE FUENTES DE AQUÍ
// Y también las funciones auxiliares 'tryFont' y 'setFont' que no son necesarias.

// La función para ajustar texto se mantiene porque es útil.
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

exports.handleIaWebhookAlejo = async (req, res) => {
  console.log('🚀 Generando diploma para Alejo...');

  try {
    // 2. MOVEMOS EL REGISTRO DENTRO DE LA FUNCIÓN PRINCIPAL
    // Esto es más seguro para entornos de servidor.
    const fontPath = path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf');
    
    // 3. ¡CAMBIO CLAVE! USA EL NOMBRE DE FAMILIA CORRECTO
    registerFont(fontPath, { family: '29LT Riwaya' }); 
    console.log(`🔤 Fuente registrada: '29LT Riwaya' desde ${fontPath}`);

    const {
      devolucion = '',
      consejo = '',
      puntos = '',
      devolucion_teorica = '',
      consejo_teorica = '',
      puntos_teorica = ''
    } = req.body;
    const imageUrl = 'https://i.ibb.co/qYDBrcRt/alejodomingo.png';

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);

    // 4. SIMPLIFICACIÓN: APLICAMOS LA FUENTE DIRECTAMENTE
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '22px "29LT Riwaya"'; // Usamos el nombre correcto de la familia
    
    const lineHeight = 30;

    // DIBUJAR TEXTOS
    if (puntos) {
      ctx.fillText(`${puntos}`, img.width * 0.25, img.height * 0.238);
    }
    if (devolucion) {
      const lines = wrapTextMultiline(ctx, devolucion, img.width * 0.84);
      lines.forEach((line, index) => ctx.fillText(line, img.width * 0.10, img.height * 0.26 + (index * lineHeight)));
    }
    if (consejo) {
      const lines = wrapTextMultiline(ctx, consejo, img.width * 0.84);
      lines.forEach((line, index) => ctx.fillText(line, img.width * 0.10, img.height * 0.42 + (index * lineHeight)));
    }
    if (puntos_teorica) {
      ctx.fillText(`${puntos_teorica}`, img.width * 0.30, img.height * 0.616);
    }
    if (devolucion_teorica) {
      const lines = wrapTextMultiline(ctx, devolucion_teorica, img.width * 0.80);
      lines.forEach((line, index) => ctx.fillText(line, img.width * 0.10, img.height * 0.64 + (index * lineHeight)));
    }
    if (consejo_teorica) {
      const lines = wrapTextMultiline(ctx, consejo_teorica, img.width * 0.80);
      lines.forEach((line, index) => ctx.fillText(line, img.width * 0.10, img.height * 0.82 + (index * lineHeight)));
    }

    console.log('✅ Diploma generado correctamente');
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};