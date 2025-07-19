const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// === Función para envolver texto con saltos de línea automáticos ===
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
    const fontPath = path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf');
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

    const imageUrl = 'https://i.ibb.co/ZpTg98t6/dip-2-viernes.png';
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // === Estilo de texto ===
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '26px "29LT Riwaya"';
    
    const lineHeight = 30;
    const marginX = 72;
    const maxWidth = img.width - marginX * 2;

    // === Textos dinámicos ===
   if (puntos) {
  ctx.font = '80px "29LT Riwaya"';
  ctx.fillText(`${puntos}`, img.width * 0.428, img.height * 0.472);
  ctx.font = '26px "29LT Riwaya"'; // restaurar fuente original
}

    if (devolucion) {
      const lines = wrapTextMultiline(ctx, devolucion, maxWidth);
      lines.forEach((line, index) => {
        ctx.fillText(line, marginX, img.height * 0.23 + (index * lineHeight));
      });
    }
    if (consejo) {
      const lines = wrapTextMultiline(ctx, consejo, maxWidth);
      lines.forEach((line, index) => {
        ctx.fillText(line, marginX, img.height * 0.351 + (index * lineHeight));
      });
    }
    if (puntos_teorica){
  ctx.font = '80px "29LT Riwaya"';
  ctx.fillText(`${puntos}`, img.width * 0.428, img.height * 0.838);
  ctx.font = '26px "29LT Riwaya"'; // restaurar fuente original
}
    
    if (devolucion_teorica) {
      const lines = wrapTextMultiline(ctx, devolucion_teorica, maxWidth);
      lines.forEach((line, index) => {
        ctx.fillText(line, marginX, img.height * 0.61 + (index * lineHeight));
      });
    }
    if (consejo_teorica) {
      const lines = wrapTextMultiline(ctx, consejo_teorica, maxWidth);
      lines.forEach((line, index) => {
        ctx.fillText(line, marginX, img.height * 0.738 + (index * lineHeight));
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
