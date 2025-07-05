const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

exports.handleIaWebhookFinal = async (req, res) => {
  console.log('🚀 Generando diploma final...');
  
  try {
    const nombre = req.body.nombre || 'Nombre';
    const ghl_id = req.body.ghl_id || 'ID';
    const devolucion_final = req.body.devolucion_final || 'Final';
    const imageUrl = 'https://i.ibb.co/RGd36ZRD/Devolucio-n3-1.png';

    console.log('📝 Datos:', { nombre, ghl_id, devolucion_final });

    // Descargar imagen
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    
    // Crear canvas
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    console.log(`📐 Dimensiones: ${img.width}x${img.height}`);

    // ===== NOMBRE =====
    ctx.fillStyle = 'white';
    ctx.font = '80px "Brittany Signature"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = img.width / 2;
    const nameY = img.height / 2 - 140;
    ctx.fillText(nombre, centerX, nameY);

    // ===== GHL_ID =====
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const idX = img.width / 2 + 100;
    const idY = (img.height * 3) / 4 + 92;
    ctx.fillText(`MF3: ${ghl_id}`, idX, idY);

    // ===== DEVOLUCION FINAL =====
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const finalX = img.width / 2;
    const finalY = img.height - 100;
    ctx.fillText(devolucion_final, finalX, finalY);

    console.log('✅ Completado');

    // Enviar respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};
