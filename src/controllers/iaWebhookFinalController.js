const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// === Función auxiliar para ajustar texto a múltiples líneas ===
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

    // === Registro de fuentes ===
    registerFont(path.join(__dirname, '..', 'fonts', 'BrittanySignature.ttf'), {
      family: 'Brittany Signature'
    });
    registerFont(path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf'), {
      family: '29LT Riwaya'
    });
    console.log("🔤 Fuentes 'Brittany Signature' y '29LT Riwaya' registradas.");

    // === Variables del cuerpo ===
    const {
      nombre = 'Nombre del Alumno',
      ghl_id = 'MF30000',
      devolucion_erick = 'Tu técnica está bien, pero continúa perfeccionando los detalles...',
      devolucion_ale = 'En tus redes, es importante ser auténtico...',
      puntuacion = '8/10'
    } = req.body;

    // === Cargar imagen base ===
    const imageUrl = 'https://i.ibb.co/8DY2NWWc/3-viernes-333333.png';
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);

    // === Crear canvas ===
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // === Estilos generales ===
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';
    const centerX = img.width / 2;
    const marginX = 72;
    const maxWidth = img.width - marginX * 2;
    const lineHeight = 30;

    // === TEXTO DE ERICK Y ALEJO (con márgenes) ===
    ctx.textAlign = 'left';
    ctx.font = '26px "29LT Riwaya"';

    const erickLines = wrapTextMultiline(ctx, devolucion_erick, maxWidth);
    erickLines.forEach((line, i) => {
      ctx.fillText(line, marginX, 520 + i * lineHeight);
    });

    const alejoLines = wrapTextMultiline(ctx, devolucion_ale, maxWidth);
    alejoLines.forEach((line, i) => {
      ctx.fillText(line, marginX, 780 + i * lineHeight);
    });

    // === PUNTUACIÓN FINAL (centrado) ===
    ctx.textAlign = 'center';
    ctx.font = '80px "29LT Riwaya"';
    ctx.fillText(puntuacion, centerX, 1045);

    // === NOMBRE DEL ALUMNO (centrado con Brittany Signature) ===
    ctx.font = '55px "Brittany Signature"';
    ctx.fillText(nombre, centerX, 1385);

    // === CÓDIGO MF300XXXX (alineado a la izquierda) ===
    ctx.textAlign = 'left';
    ctx.font = '26px "29LT Riwaya"';
    const idFinal = ghl_id.slice(-4);
    const codigoFinal = `MF300${idFinal}`;
    ctx.fillText(codigoFinal, centerX + 2, 1565);

    // === Enviar imagen generada ===
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
    console.log('✅ Diploma generado exitosamente');
  } catch (error) {
    console.error('❌ Error generando diploma:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};
