const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

exports.handleIaWebhook = async (req, res) => {
  console.log('🚀 Generando diploma con Arial...');
  
  try {
    const nombre = req.body.nombre || 'Nombre de Prueba';
    const ghl_id = req.body.ghl_id || 'ID123';
    const imageUrl = 'https://i.ibb.co/c5zTvqw/Diploma-Mf-3-0.png';

    console.log('📝 Datos:', { nombre, ghl_id });

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

    // ===== NOMBRE =====
    ctx.fillStyle = 'red';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = img.width / 2;
    const centerY = img.height / 2;
    
    console.log(`📍 Nombre en: (${centerX}, ${centerY})`);
    
    ctx.fillText(nombre, centerX, centerY);
    
    // ===== ID =====
    ctx.fillStyle = 'red';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    
    const idX = img.width - 20;
    const idY = img.height - 20;
    
    console.log(`🏷️ ID en: (${idX}, ${idY})`);
    
    ctx.fillText(`ID: ${ghl_id}`, idX, idY);
    
    console.log('✅ Completado');

    // Enviar respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};