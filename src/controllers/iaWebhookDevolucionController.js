const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

exports.handleIaWebhookDevolucion = async (req, res) => {
  console.log('🚀 Generando diploma con Arial (Devolución)...');
  
  try {
    const nombre = req.body.nombre || 'Nombre de Prueba';
    const devolucion_erick = req.body.devolucion_erick || 'ID123';
    const imageUrl = 'https://i.ibb.co/DHNgFvgg/Devolucio-n1-1.png';

    console.log('📝 Datos:', { nombre, devolucion_erick });

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

    // ===== NOMBRE (justo después del "Hola") =====
    ctx.fillStyle = 'white';
    ctx.font = '60px Arial'; // Cambiado a Arial como solicitaste
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = img.width / 2;
    const nameY = img.height * 0.25; // Posición más arriba, cerca del "Hola"
    
    console.log(`📍 Nombre en: (${centerX}, ${nameY})`);
    console.log(`🎨 Fuente del nombre: ${ctx.font}`);
    
    ctx.fillText(nombre, centerX, nameY);
    
    // ===== DEVOLUCION ERICK (debajo del texto "Devolución Erick Gómez:") =====
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left'; // Alineación a la izquierda para que coincida con el texto
    ctx.textBaseline = 'middle';
    
    // Posición debajo del texto "Puntuación del corte:"
    const idX = img.width * 0.12; // Margen izquierdo similar al texto superior
    const idY = img.height * 0.62; // Debajo del texto "Devolución Erick Gómez:"
    
    console.log(`🏷️ Devolución Erick en: (${idX}, ${idY})`);
    
    // Agregar un bullet point para que se vea como una lista
    ctx.fillText(`• ${devolucion_erick}`, idX, idY);
    
    console.log('✅ Completado');

    // Enviar respuesta
    res.set('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);

  } catch (error) {
    console.error('💥 Error:', error);
    res.status(500).json({ error: 'Error generando diploma' });
  }
};