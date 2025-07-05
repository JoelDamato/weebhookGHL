const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

exports.handleIaWebhookAlejo = async (req, res) => {
  console.log('🚀 Generando diploma para Alejo...');
  
  try {
    const devolucion_alejo = req.body.devolucion_alejo || 'Alejo';
    const devolucion_teorica = req.body.devolucion_teorica || 'Teórica';
    const imageUrl = 'https://i.ibb.co/DHNgFvgg/Devolucio-n1-1.png';

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

    // ===== DEVOLUCION ALEJO =====
    ctx.fillStyle = 'white';
    ctx.font = '80px "Brittany Signature"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = img.width / 2;
    const alejoY = img.height / 2 - 140;
    
    ctx.fillText(devolucion_alejo, centerX, alejoY);

    // ===== DEVOLUCION TEORICA =====
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const teoricaX = img.width / 2 + 100;
    const teoricaY = (img.height * 3) / 4 + 92;
    
    ctx.fillText(`MF3: ${devolucion_teorica}`, teoricaX, teoricaY);

    console.log('✅ Completado');

    // Enviar respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};
