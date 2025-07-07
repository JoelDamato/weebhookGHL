const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

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

    // ===== DEVOLUCION ALEJO (debajo del título "Devolución Alejo") =====
    ctx.fillStyle = 'white';
    ctx.font = '24px "Arial"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Cambio principal: usar 50% del ancho para centrar correctamente
    const centerX = img.width * 0.45; // Centro horizontal de la imagen
    const alejoY = img.height * 0.30; // Aproximadamente 30% de la altura
    
    ctx.fillText(devolucion_alejo, centerX, alejoY);

    // ===== DEVOLUCION TEORICA (debajo del título "Evaluación Teórica") =====
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Coordenadas ajustadas para la sección de evaluación teórica
    const teoricaX = img.width * 0.15; // 15% del ancho desde la izquierda
    const teoricaY = img.height * 0.73; // 73% de la altura
    
    // Texto con formato de evaluación
    const evaluacionTexto = `${devolucion_teorica}`;
    ctx.fillText(evaluacionTexto, teoricaX, teoricaY);

    console.log('✅ Completado');

    // Enviar respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};