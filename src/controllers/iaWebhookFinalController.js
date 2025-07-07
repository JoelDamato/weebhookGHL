const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// Registrar fuente
registerFont(path.join(__dirname, '..', 'fonts', 'BrittanySignature.ttf'), {
  family: 'Brittany Signature'
});

// Envoltura de texto
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

// Handler
const handleIaWebhookFinal = async (req, res) => {
  try {
    const {
      nombre = 'Nombre del Alumno',
      ghl_id = 'MF30000',
      devolucion_erick = 'Tu técnica está bien, pero continúa perfeccionando los detalles en las transiciones...',
      devolucion_ale = 'En tus redes, es importante ser auténtico y mostrar tu proceso...',
      puntuacion = '8/10'
    } = req.body;

    const imageUrl = 'https://i.ibb.co/PZxLnTyy/Devolucio-n3-1.png';

    // Descargar fondo
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const centerX = img.width / 2;

    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    // === Erick ===
    ctx.font = '22px Arial';
    const erickX = 110;
    const erickY = 505;
    const maxWidth = 980;
    const erickLines = wrapTextMultiline(ctx, devolucion_erick, maxWidth);
    erickLines.forEach((line, i) => {
      ctx.fillText(line, erickX, erickY + i * 28);
    });

    // === Alejo ===
    const alejoX = 110;
    const alejoY = 775;
    const alejoLines = wrapTextMultiline(ctx, devolucion_ale, maxWidth);
    alejoLines.forEach((line, i) => {
      ctx.fillText(line, alejoX, alejoY + i * 28);
    });

    // === Puntuación Final ===
    ctx.textAlign = 'center';
    ctx.font = 'bold 54px Arial';
    const scoreY = 1135;
    ctx.fillText(puntuacion, centerX, scoreY);

    // === Nombre del Alumno ===
    ctx.font = '60px "Brittany Signature"';
    const nameY = 1420;
    ctx.fillText(nombre, centerX, nameY);

ctx.textAlign = 'left';
ctx.font = 'bold 24px Arial';
const idX = centerX + 110; // Mover 100px a la derecha del centro
const idY = 1590; // Asegurate de usar un valor realista, no 16000
ctx.fillText(`MF300${ghl_id}`, idX, idY);

    // Respuesta final
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (error) {
    console.error('❌ Error generando diploma:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};

exports.handleIaWebhookFinal = handleIaWebhookFinal;
