const path = require('path'); 
const { createCanvas, loadImage, registerFont } = require('canvas'); 
const axios = require('axios'); 

console.log('🔤 Registrando fuente Brittany Signature...');
// Registrar fuentes personalizadas 
registerFont(path.join(__dirname, '..', 'fonts', 'BrittanySignature.ttf'), { 
  family: 'Brittany Signature' 
}); 

console.log('🔤 Registrando fuente Riwaya...');
console.log('📁 Ruta de fuente:', path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf'));

// Intentar con diferentes nombres de fuente
try {
  // Opción 1: Nombre del archivo sin extensión
  registerFont(path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf'), {
    family: '29lt-riwaya-regular'
  });
  console.log('✅ Fuente registrada como: 29lt-riwaya-regular');
} catch (error) {
  console.log('❌ Error con nombre 29lt-riwaya-regular:', error.message);
}

try {
  // Opción 2: Nombre simplificado
  registerFont(path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf'), {
    family: 'Riwaya'
  });
  console.log('✅ Fuente registrada como: Riwaya');
} catch (error) {
  console.log('❌ Error con nombre Riwaya:', error.message);
}

try {
  // Opción 3: Nombre completo
  registerFont(path.join(__dirname, '..', 'fonts', '29lt-riwaya-regular.ttf'), {
    family: '29LT Riwaya Regular'
  });
  console.log('✅ Fuente registrada como: 29LT Riwaya Regular');
} catch (error) {
  console.log('❌ Error con nombre 29LT Riwaya Regular:', error.message);
}

console.log('✅ Fuentes registradas correctamente');
 
// Función para envolver texto con saltos de línea automáticos 
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
    if (p < paragraphs.length - 1) lines.push(''); 
  } 
 
  return lines; 
} 
 
// Función principal 
const handleIaWebhookFinal = async (req, res) => { 
  try {
    console.log('🎨 Iniciando generación de diploma...');
    
    const { 
      nombre = 'Nombre del Alumno', 
      ghl_id = 'MF30000', 
      devolucion_erick = 'Tu técnica está bien, pero continúa perfeccionando los detalles en las transiciones...', 
      devolucion_ale = 'En tus redes, es importante ser auténtico y mostrar tu proceso...', 
      puntuacion = '8/10' 
    } = req.body; 

    console.log('📝 Datos recibidos:', {
      nombre,
      ghl_id,
      puntuacion,
      devolucion_erick_length: devolucion_erick.length,
      devolucion_ale_length: devolucion_ale.length
    });
 
    // URL de la plantilla base 
    const imageUrl = 'https://i.ibb.co/PZxLnTyy/Devolucio-n3-1.png'; 

    console.log('🖼️ Descargando imagen base...');
    // Descargar y preparar imagen base 
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' }); 
    const buffer = Buffer.from(response.data, 'binary'); 
    const img = await loadImage(buffer); 
    const canvas = createCanvas(img.width, img.height); 
    const ctx = canvas.getContext('2d');

    console.log('📏 Dimensiones del canvas:', img.width, 'x', img.height);
 
    ctx.drawImage(img, 0, 0); 
    ctx.fillStyle = 'white'; 
    const centerX = img.width / 2; 
    const maxWidth = 980; 

    console.log('🎯 Centro X:', centerX, 'Max width:', maxWidth);
 
    // === TEXTO DE ERICK === 
    console.log('✏️ Aplicando texto de Erick...');
    ctx.textAlign = 'left'; 
    
    // Probar diferentes nombres de fuente
    const fontNames = ['29lt-riwaya-regular', 'Riwaya', '29LT Riwaya Regular', '29LT Riwaya'];
    let fontApplied = false;
    
    for (const fontName of fontNames) {
      try {
        ctx.font = `22px "${fontName}"`;
        // Verificar si la fuente se aplicó midiendo el texto
        const testWidth = ctx.measureText('Test').width;
        console.log(`🔤 Probando fuente "${fontName}": width=${testWidth}`);
        if (testWidth > 0) {
          console.log(`✅ Fuente aplicada exitosamente: ${fontName}`);
          fontApplied = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Error con fuente "${fontName}":`, error.message);
      }
    }
    
    if (!fontApplied) {
      console.log('⚠️ Usando fuente por defecto para Erick');
      ctx.font = '22px Arial';
    }
    
    console.log('🔤 Fuente final aplicada para Erick:', ctx.font);
    const erickX = 50; 
    const erickY = 505; 
    const erickLines = wrapTextMultiline(ctx, devolucion_erick, maxWidth); 
    console.log('📄 Líneas de texto Erick:', erickLines.length);
    erickLines.forEach((line, i) => { 
      console.log(`📝 Línea ${i + 1}: "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`);
      ctx.fillText(line, erickX, erickY + i * 30); 
    }); 
 
    // === TEXTO DE ALEJO === 
    console.log('✏️ Aplicando texto de Alejo...');
    // Reutilizar la fuente que funcionó
    const alejoX = 50; 
    const alejoY = 780; // Fijo más abajo 
    const alejoLines = wrapTextMultiline(ctx, devolucion_ale, maxWidth); 
    console.log('📄 Líneas de texto Alejo:', alejoLines.length);
    alejoLines.forEach((line, i) => { 
      console.log(`📝 Línea ${i + 1}: "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`);
      ctx.fillText(line, alejoX, alejoY + i * 30); 
    }); 
 
    // === PUNTUACIÓN FINAL === 
    console.log('🏆 Aplicando puntuación...');
    ctx.textAlign = 'center'; 
    
    // Probar fuente bold para puntuación
    fontApplied = false;
    for (const fontName of fontNames) {
      try {
        ctx.font = `bold 54px "${fontName}"`;
        const testWidth = ctx.measureText('8/10').width;
        console.log(`🔤 Probando fuente bold "${fontName}": width=${testWidth}`);
        if (testWidth > 0) {
          console.log(`✅ Fuente bold aplicada exitosamente: ${fontName}`);
          fontApplied = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Error con fuente bold "${fontName}":`, error.message);
      }
    }
    
    if (!fontApplied) {
      console.log('⚠️ Usando fuente por defecto bold para puntuación');
      ctx.font = 'bold 54px Arial';
    }
    
    console.log('🔤 Fuente aplicada para puntuación:', ctx.font);
    console.log('🎯 Posición puntuación:', centerX, 1135);
    ctx.fillText(puntuacion, centerX, 1135); 
 
    // === NOMBRE DEL ALUMNO === 
    console.log('👤 Aplicando nombre del alumno...');
    ctx.font = '50px "Brittany Signature"'; 
    console.log('🔤 Fuente aplicada para nombre:', ctx.font);
    console.log('🎯 Posición nombre:', centerX, 1420);
    ctx.fillText(nombre, centerX, 1420); 
 
    // === CÓDIGO MF300XXXX === 
    console.log('🆔 Aplicando código...');
    ctx.textAlign = 'left'; 
    
    // Probar fuente bold para código
    fontApplied = false;
    for (const fontName of fontNames) {
      try {
        ctx.font = `bold 24px "${fontName}"`;
        const testWidth = ctx.measureText('MF300').width;
        console.log(`🔤 Probando fuente bold "${fontName}" para código: width=${testWidth}`);
        if (testWidth > 0) {
          console.log(`✅ Fuente bold aplicada exitosamente para código: ${fontName}`);
          fontApplied = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Error con fuente bold "${fontName}" para código:`, error.message);
      }
    }
    
    if (!fontApplied) {
      console.log('⚠️ Usando fuente por defecto bold para código');
      ctx.font = 'bold 24px Arial';
    }
    
    console.log('🔤 Fuente aplicada para código:', ctx.font);
    const idFinal = ghl_id.slice(-4); // Últimos 4 caracteres del ID 
    const codigoFinal = `MF300${idFinal}`;
    console.log('🏷️ Código generado:', codigoFinal);
    console.log('🎯 Posición código:', centerX + 110, 1590);
    ctx.fillText(codigoFinal, centerX + 110, 1590); 
 
    // === SALIDA === 
    console.log('💾 Enviando imagen generada...');
    res.set('Content-Type', 'image/png'); 
    canvas.createPNGStream().pipe(res); 
    console.log('✅ Diploma generado exitosamente');
  } catch (error) { 
    console.error('❌ Error generando diploma:', error);
    console.error('🔍 Stack trace:', error.stack);
    res.status(500).json({ error: 'Error generando diploma' }); 
  } 
}; 
 
exports.handleIaWebhookFinal = handleIaWebhookFinal;