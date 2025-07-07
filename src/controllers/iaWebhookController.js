const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');

const fontPath = path.join(__dirname, '..', 'fonts', 'BrittanySignature.ttf');

if (fs.existsSync(fontPath)) {
  console.log('🔤 Registrando fuente Brittany Signature...');
  registerFont(fontPath, { family: 'Brittany Signature' });
} else {
  console.warn('⚠️ Fuente NO encontrada en:', fontPath);
}

exports.handleIaWebhook = async (req, res) => {
  console.log('🚀 Generando diploma...');

  try {
    const nombre = req.body.nombre || 'Nombre de Prueba';
    const ghl_id = req.body.ghl_id || 'ID123';
    const imageUrl = 'https://i.ibb.co/c5zTvqw/Diploma-Mf-3-0.png';

    console.log('📝 Datos recibidos:', { nombre, ghl_id });

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const img = await loadImage(buffer);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);

    // ====== Nombre en el centro ======
    ctx.fillStyle = 'white';
    ctx.font = '80px "Brittany Signature"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = img.width / 2;
    const nameY = img.height / 2 - 140;
    ctx.fillText(nombre, centerX, nameY);

    // ====== ID al lado de "Diploma" (parte inferior izquierda) ======
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const diplomaX = 402;         // X donde comienza la palabra "Diploma"
    const diplomaY = 1531;        // Y donde está "Diploma" en la imagen
    const diplomaText = 'Diploma';
    const diplomaWidth = ctx.measureText(diplomaText).width;

    const ghl_id_last4 = ghl_id.toString().slice(-4);
    const idText = 'Nº MF300' + ghl_id_last4;

    const marginBetween = 20;
    const idX = diplomaX + diplomaWidth + marginBetween;

    ctx.fillText(idText, idX, diplomaY);

    console.log('✅ Diploma generado correctamente.');
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error al generar diploma:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};
