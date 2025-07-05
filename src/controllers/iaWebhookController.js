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
    ctx.fillStyle = 'white';
    ctx.font = '80px "Brittany Signature"'; // Aumentar tamaño de 64px a 80px
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = img.width / 2;
    const nameY = img.height / 2 - 140; // Bajar 10px (era -150, ahora -140)
    
    console.log(`📍 Nombre en: (${centerX}, ${nameY})`);
    console.log(`🎨 Fuente del nombre: ${ctx.font}`);
    
    ctx.fillText(nombre, centerX, nameY);
    
    // ===== ID =====
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const idX = img.width / 2 + 100;
    const idY = (img.height * 3) / 4 + 92;

    // Mostrar solo los últimos 4 dígitos del ghl_id
    const ghl_id_last4 = ghl_id.toString().slice(-4);

    console.log(`🏷️ ID en: (${idX}, ${idY})`);

    // Dibuja "Nº MF" y el ID con tamaños distintos
    const prefix = 'Nº MF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(prefix, idX - 18, idY); // Ajusta -18 para alinear mejor

    ctx.font = 'bold 18px Arial';
    ctx.fillText(ghl_id_last4, idX + 32, idY); // Ajusta +32 para alinear mejor
    
    console.log('✅ Completado');

    // Enviar respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};