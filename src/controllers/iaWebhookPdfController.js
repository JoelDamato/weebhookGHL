// controllers/iaWebhookPdfController.js

const pdfMake = require('pdfmake');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp'); // Se añade la librería 'sharp' para redimensionar imágenes

// Asegúrate de instalar sharp: npm install sharp

exports.handleIaWebhookPdf = async (req, res) => {
    const debugLogs = [];
    const log = (message, data = null) => {
        const logEntry = { timestamp: new Date().toISOString(), message: message, data: data };
        debugLogs.push(logEntry);
        console.log(`[LOG] ${message}`, data);
    };

    try {
        log('Iniciando el procesamiento del webhook...');

        const { Imagen1, Imagen2, Imagen3, Imagen4 } = req.body;
        const imageUrls = [ Imagen1, Imagen2, Imagen3, Imagen4 ];

        log('URLs recibidas del cliente', imageUrls);
        if (!imageUrls.every(url => url && typeof url === 'string')) {
            log('Error: Se esperan 4 URLs de imagen válidas.', { input: req.body });
            return res.status(400).send('Se esperan 4 URLs de imagen válidas.');
        }

        log('URLs validadas. Iniciando descarga de imágenes...');

        const downloadPromises = imageUrls.map(url =>
            axios.get(url, {
                responseType: 'arraybuffer',
                validateStatus: status => status === 200,
                timeout: 120000,
                maxContentLength: 100 * 1024 * 1024,
                maxBodyLength: 100 * 1024 * 1024
            })
            .catch(error => {
                log(`Error de descarga para la URL: ${url}`, {
                    status: error.response ? error.response.status : 'No response',
                    statusText: error.response ? error.response.statusText : 'Network error'
                });
                return Promise.reject(error);
            })
        );
        
        const responses = await Promise.all(downloadPromises);
        
        log('Descarga de imágenes completada. Redimensionando y creando PDF...');

        const processedImagesPromises = responses.map(async (response, index) => {
            const buffer = Buffer.from(response.data);
            const sizeInMB = buffer.length / (1024 * 1024);
            log(`Imagen ${index + 1}: Tamaño original ${sizeInMB.toFixed(2)}MB`);

            // Usamos 'sharp' para redimensionar la imagen a un tamaño óptimo para A4 (300dpi)
            const processedImageBuffer = await sharp(buffer)
                .resize(2480, 3508, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
                .jpeg({ quality: 90 }) // Opciones de compresión para reducir el tamaño
                .toBuffer();

            const processedSizeInMB = processedImageBuffer.length / (1024 * 1024);
            log(`Imagen ${index + 1}: Tamaño redimensionado ${processedSizeInMB.toFixed(2)}MB`);
            
            return `data:image/jpeg;base64,${processedImageBuffer.toString('base64')}`;
        });

        const imagesBase64 = await Promise.all(processedImagesPromises);
        
        log('Imágenes redimensionadas y convertidas a base64. Configurando documento PDF...');

        const documentDefinition = {
            pageSize: 'A4',
            pageMargins: [0, 0, 0, 0],
            content: imagesBase64.map((base64Image, index) => {
                return {
                    image: base64Image,
                    width: 595.28,
                    height: 841.89,
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };
            })
        };

        log('Configuración del documento completada. Generando PDF...');
        
        const printer = new pdfMake({});
        const pdfDoc = printer.createPdfKitDocument(documentDefinition);

        const pdfBuffer = await Promise.race([
            new Promise((resolve, reject) => {
                const chunks = [];
                
                pdfDoc.on('data', chunk => {
                    chunks.push(chunk);
                });
                
                pdfDoc.on('end', () => {
                    log('PDF generado exitosamente');
                    resolve(Buffer.concat(chunks));
                });

                pdfDoc.on('error', (error) => {
                    log('Error al generar PDF', error);
                    reject(error);
                });
                
                pdfDoc.end();
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout al generar PDF después de 2 minutos')), 120000)
            )
        ]);

        log(`PDF creado con éxito. Tamaño: ${pdfBuffer.length} bytes`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="certificados_reporte.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.send(pdfBuffer);
        
    } catch (error) {
        log('🔴 Error crítico en el flujo de procesamiento.', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al generar PDF.',
            error: error.message,
            logs: debugLogs
        });
    }
};