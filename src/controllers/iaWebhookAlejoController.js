const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// Intentar registrar la fuente con diferentes nombres
const fontPath = path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf');

try {
  // Intentar diferentes variaciones del nombre
  console.log('🔤 Intentando registrar fuente:', fontPath);
  
  // Opción 1: Nombre completo como aparece en el sistema
  registerFont(fontPath, { family: '29LT Riwaya' });
  console.log('✅ Registrada como: 29LT Riwaya');
  
  // Opción 2: Nombre simplificado
  registerFont(fontPath, { family: 'Riwaya' });
  console.log('✅ Registrada como: Riwaya');
  
  // Opción 3: Nombre con Regular
  registerFont(fontPath, { family: '29LT Riwaya Regular' });
  console.log('✅ Registrada como: 29LT Riwaya Regular');
  
  // Opción 4: Nombre sin espacios
  registerFont(fontPath, { family: '29LTRiwaya' });
  console.log('✅ Registrada como: 29LTRiwaya');
  
} catch (error) {
  console.error('❌ Error registrando fuente:', error);
}

// Función para probar diferentes nombres de fuente
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

// Función mejorada para ajustar texto y respetar saltos de línea
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

// Función para configurar fuente con fallback
function setFont(ctx, size, weight = '') {
  const fontNames = ['29LT Riwaya', 'Riwaya', '29LT Riwaya Regular', '29LTRiwaya'];
  
  for (const fontName of fontNames) {
    if (tryFont(ctx, fontName, size, weight)) {
      return;
    }
  }
  
  // Fallback a Arial si ninguna funciona
  console.log('⚠️ Usando Arial como fallback');
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

    console.log('📝 Datos:', { devolucion, consejo, puntos, devolucion_teorica, consejo_teorica, puntos_teorica });

    // Descargar imagen base
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    console.log(`📐 Dimensiones: ${img.width}x${img.height}`);

    // Dibujar imagen base
    ctx.drawImage(img, 0, 0);

    // ===== CONFIGURACIÓN DE POSICIONES =====
    const devX = img.width * 0.10;
    const maxWidth = img.width * 0.84;
    const lineHeight = 25;
    const teoricaLineHeight = 22;
    const teoricaMaxWidth = img.width * 0.80;

    // POSICIONES SECCIÓN PRÁCTICA
    const puntosY = img.height * 0.238;
    const devolucionY = img.height * 0.26;
    const consejoY = img.height * 0.42;

    // POSICIONES SECCIÓN TEÓRICA
    const puntosTeoricaY = img.height * 0.619;
    const devolucionTeoricaY = img.height * 0.64;
    const consejoTeoricaY = img.height * 0.82;

    // ===== COORDENADAS X PARA CADA ELEMENTO =====
    const puntosX = img.width * 0.25;
    const devolucionX = devX;
    const consejoX = devX;
    const puntosTeoricaX = img.width * 0.30;
    const devolucionTeoricaX = devX;
    const consejoTeoricaX = devX;

    // ===== ANCHOS MÁXIMOS PARA CADA ELEMENTO =====
    const maxWidthDevolucion = maxWidth;
    const maxWidthConsejo = maxWidth;
    const maxWidthDevolucionTeorica = teoricaMaxWidth;
    const maxWidthConsejoTeorica = teoricaMaxWidth;

    // ===== Estilos de texto =====
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // ===== SECCIÓN PRÁCTICA =====
    
    // Puntos prácticos
    if (puntos) {
      console.log('🎯 Configurando fuente para puntos prácticos...');
      setFont(ctx, 20, 'bold');
      ctx.fillText(`${puntos}`, puntosX, puntosY);
    }

    // Devolución práctica
    if (devolucion) {
      console.log('📝 Configurando fuente para devolución práctica...');
      setFont(ctx, 18);
      let currentY = devolucionY;
      const devolucionLines = wrapTextMultiline(ctx, devolucion, maxWidthDevolucion);
      devolucionLines.forEach((line, index) => {
        ctx.fillText(line, devolucionX, currentY + (index * lineHeight));
      });
    }

    // Consejo práctico
    if (consejo) {
      console.log('💡 Configurando fuente para consejo práctico...');
      setFont(ctx, 18);
      let currentY = consejoY;
      const consejoLines = wrapTextMultiline(ctx, consejo, maxWidthConsejo);
      consejoLines.forEach((line, index) => {
        ctx.fillText(line, consejoX, currentY + (index * lineHeight));
      });
    }

    // ===== SECCIÓN TEÓRICA =====
    
    // Puntos teóricos
    if (puntos_teorica) {
      console.log('🎯 Configurando fuente para puntos teóricos...');
      setFont(ctx, 18, 'bold');
      ctx.fillText(`${puntos_teorica}`, puntosTeoricaX, puntosTeoricaY);
    }

    // Devolución teórica
    if (devolucion_teorica) {
      console.log('📝 Configurando fuente para devolución teórica...');
      setFont(ctx, 16);
      let currentY = devolucionTeoricaY;
      const devolucionTeoricaLines = wrapTextMultiline(ctx, devolucion_teorica, maxWidthDevolucionTeorica);
      devolucionTeoricaLines.forEach((line, index) => {
        ctx.fillText(line, devolucionTeoricaX, currentY + (index * teoricaLineHeight));
      });
    }

    // Consejo teórico
    if (consejo_teorica) {
      console.log('💡 Configurando fuente para consejo teórico...');
      setFont(ctx, 16);
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