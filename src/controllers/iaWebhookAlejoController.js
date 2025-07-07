const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

// Función para dividir texto en líneas
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

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
  return lines;
}

exports.handleIaWebhookAlejo = async (req, res) => {
  console.log('🚀 Generando diploma para Alejo...');
  
  try {
    const devolucion_alejo = req.body.devolucion_alejo || 'Alejo';
    const devolucion_teorica = req.body.devolucion_teorica || 'Teórica';
    const imageUrl = 'https://i.ibb.co/G4qdhZ6s/alejo.png';

    console.log('📝 Datos:', { devolucion_alejo, devolucion_teorica });

    // Descargar imagen
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    
    // Crear canvas
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    console.log(`📐 Dimensiones: ${img.width}x${img.height}`);

    // Dibujar imagen base
    ctx.drawImage(img, 0, 0);

    // ===== DEVOLUCION ALEJO (debajo del título "Devolución Erick Gómez:") =====
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Posición para el contenido de la devolución (área blanca grande)
    const alejoX = img.width * 0.10; // 8% del ancho desde la izquierda
    const alejoY = img.height * 0.27; // Aproximadamente 42% de la altura
    
    // Dividir texto en líneas si es muy largo
    const maxWidth = img.width * 0.84; // 84% del ancho disponible
    const lines = wrapText(ctx, devolucion_alejo, maxWidth);
    
    // Dibujar cada línea
    const lineHeight = 25;
    lines.forEach((line, index) => {
      ctx.fillText(line, alejoX, alejoY + (index * lineHeight));
    });

    // ===== DEVOLUCION TEORICA (debajo de "• Puntuación:" de la sección teórica) =====
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Coordenadas para la sección de evaluación teórica (debajo del bullet point)
    const teoricaX = img.width * 0.12; // 12% del ancho desde la izquierda (indentado)
    const teoricaY = img.height * 0.74; // 77% de la altura
    
    // Dividir texto en líneas si es muy largo
    const teoricaMaxWidth = img.width * 0.80; // 80% del ancho disponible
    const teoricaLines = wrapText(ctx, devolucion_teorica, teoricaMaxWidth);
    
    // Dibujar cada línea
    const teoricaLineHeight = 22;
    teoricaLines.forEach((line, index) => {
      ctx.fillText(line, teoricaX, teoricaY + (index * teoricaLineHeight));
    });

    console.log('✅ Completado');

    // Enviar respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};