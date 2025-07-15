const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

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
    if (p < paragraphs.length - 1) lines.push('');
  }
  return lines;
}

exports.handleIaWebhookFinal = async (req, res) => {
  try {
    console.log('🎨 Iniciando generación de diploma final...');

    registerFont(path.join(__dirname, '..', 'fonts', 'BrittanySignature.ttf'), {
      family: 'Brittany Signature'
    });
    registerFont(path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf'), {
      family: '29LT Riwaya'
    });
    console.log("🔤 Fuentes 'Brittany Signature' y '29LT Riwaya' registradas.");

    const {
      nombre = 'Nombre del Alumno',
      ghl_id = 'MF30000',
      devolucion_erick = 'Tu técnica está bien, pero continúa perfeccionando los detalles...',
      devolucion_ale = 'En tus redes, es importante ser auténtico...',
      puntuacion = '8/10'
    } = req.body;

    const imageUrl = 'https://i.ibb.co/PZxLnTyy/Devolucio-n3-1.png';
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = 'white';
    const centerX = img.width / 2;
    const maxWidth = 980;

    // === TEXTO DE ERICK Y ALEJO (con 29LT Riwaya) ===
    ctx.textAlign = 'left';
    ctx.font = '22px "29LT Riwaya"';
    const erickLines = wrapTextMultiline(ctx, devolucion_erick, maxWidth);
    erickLines.forEach((line, i) => ctx.fillText(line, 50, 505 + i * 30));
    const alejoLines = wrapTextMultiline(ctx, devolucion_ale, maxWidth);
    alejoLines.forEach((line, i) => ctx.fillText(line, 50, 780 + i * 30));

    // === PUNTUACIÓN FINAL (con 29LT Riwaya) ===
    ctx.textAlign = 'center';
    // --- CAMBIO AQUÍ: Se quitó "bold" ---
    ctx.font = '54px "29LT Riwaya"';
    ctx.fillText(puntuacion, centerX, 1135);

    // === NOMBRE DEL ALUMNO (con Brittany Signature) ===
    ctx.font = '50px "Brittany Signature"';
    ctx.fillText(nombre, centerX, 1420);

    // === CÓDIGO MF300XXXX (con 29LT Riwaya) ===
    ctx.textAlign = 'left';
    // --- CAMBIO AQUÍ: Se quitó "bold" ---
    ctx.font = '24px "29LT Riwaya"';
    const idFinal = ghl_id.slice(-4);
    const codigoFinal = `MF300${idFinal}`;
    ctx.fillText(codigoFinal, centerX + 110, 1590);

    // === SALIDA ===
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
    console.log('✅ Diploma generado exitosamente');
  } catch (error) {
    console.error('❌ Error generando diploma:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};