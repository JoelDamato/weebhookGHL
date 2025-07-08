const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// Registrar fuente personalizada
registerFont(path.join(__dirname, '..', 'fonts', 'BrittanySignature.ttf'), {
  family: 'Brittany Signature'
});

// Función para envolver texto con saltos de línea automáticos
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

// Función principal
const handleIaWebhookFinal = async (req, res) => {
  try {
    const {
      nombre = 'Nombre del Alumno',
      ghl_id = 'MF30000',
      devolucion_erick = 'Tu técnica está bien, pero continúa perfeccionando los detalles en las transiciones...',
      devolucion_ale = 'En tus redes, es importante ser auténtico y mostrar tu proceso...',
      puntuacion = '8/10'
    } = req.body;

    // URL de la plantilla base
    const imageUrl = 'https://i.ibb.co/PZxLnTyy/Devolucio-n3-1.png';

    // Descargar y preparar imagen base
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = 'white';
    const centerX = img.width / 2;
    const maxWidth = 980;

    // === TEXTO DE ERICK ===
    ctx.textAlign = 'left';
    ctx.font = '22px Arial';
    const erickX = 50;
    const erickY = 505;
    const erickLines = wrapTextMultiline(ctx, devolucion_erick, maxWidth);
    erickLines.forEach((line, i) => {
      ctx.fillText(line, erickX, erickY + i * 30);
    });

    // === TEXTO DE ALEJO ===
    const alejoX = 50;
    const alejoY = 780; // Fijo más abajo
    const alejoLines = wrapTextMultiline(ctx, devolucion_ale, maxWidth);
    alejoLines.forEach((line, i) => {
      ctx.fillText(line, alejoX, alejoY + i * 30);
    });

    // === PUNTUACIÓN FINAL ===
    ctx.textAlign = 'center';
    ctx.font = 'bold 54px Arial';
    ctx.fillText(puntuacion, centerX, 1135);

    // === NOMBRE DEL ALUMNO ===
    ctx.font = '60px "Brittany Signature"';
    ctx.fillText(nombre, centerX, 1420);

    // === CÓDIGO MF300XXXX ===
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px Arial';
    const idFinal = ghl_id.slice(-4); // Últimos 4 caracteres del ID
    ctx.fillText(`MF300${idFinal}`, centerX + 110, 1590);

    // === SALIDA ===
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (error) {
    console.error('❌ Error generando diploma:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};

exports.handleIaWebhookFinal = handleIaWebhookFinal;
