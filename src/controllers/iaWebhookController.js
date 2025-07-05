const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

// Ruta real a la fuente (fuente ubicada en: src/fonts/BrittanySignature.ttf)
const fontPath = path.join(__dirname, '..', 'fonts', 'BrittanySignature.ttf');

// Verificamos si la fuente existe antes de registrarla
if (fs.existsSync(fontPath)) {
  console.log('🔤 Registrando fuente Brittany Signature...');
  registerFont(fontPath, { family: 'Brittany Signature' });
} else {
  console.warn('⚠️ Fuente Brittany Signature NO encontrada en:', fontPath);
}

exports.handleIaWebhook = async (req, res) => {
  console.log('🚀 Generando diploma...');

  try {
    const nombre = req.body.nombre || 'Nombre de Prueba';
    const ghl_id = req.body.ghl_id || 'ID123';
    const imageUrl = 'https://i.ibb.co/c5zTvqw/Diploma-Mf-3-0.png';

    console.log('📝 Datos recibidos:', { nombre, ghl_id });

    // Descargar imagen base
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    console.log(`📐 Dimensiones de imagen: ${img.width}x${img.height}`);

    // Dibujar la imagen de fondo
    ctx.drawImage(img, 0, 0);

    // ====== NOMBRE ======
    ctx.fillStyle = 'white';
    ctx.font = '80px "Brittany Signature"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = img.width / 2;
    const nameY = img.height / 2 - 140;
    console.log(`📍 Posición del nombre: (${centerX}, ${nameY})`);

    ctx.fillText(nombre, centerX, nameY);

    // ====== ID ======
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const idX = img.width / 2 + 100;
    const idY = (img.height * 3) / 4 + 92;
    const ghl_id_last4 = ghl_id.toString().slice(-4);

    console.log(`🏷️ Posición del ID: (${idX}, ${idY})`);

    ctx.fillText('Nº MF', idX - 18, idY);
    ctx.font = 'bold 18px Arial';
    ctx.fillText(ghl_id_last4, idX + 32, idY);

    console.log('✅ Diploma generado correctamente.');

    // Enviar imagen como respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error al generar diploma:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};
