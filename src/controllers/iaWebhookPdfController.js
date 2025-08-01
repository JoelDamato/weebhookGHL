// controllers/iaWebhookPdfController.js

const pdfMake = require('pdfmake');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const sizeOf = require('image-size'); // Agregar esta línea

exports.handleIaWebhookPdf = async (req, res) => {
    // Array para almacenar todos los logs
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
                validateStatus: status => status === 200
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
        
        log('Descarga de imágenes completada. Creando PDF...');

        // Convertimos los buffers a base64 para pdfmake Y obtenemos dimensiones
        const imagesData = responses.map(response => {
            const buffer = Buffer.from(response.data);
            const dimensions = sizeOf(buffer); // Obtener dimensiones reales
            const base64 = `data:${response.headers['content-type']};base64,${buffer.toString('base64')}`;
            
            return {
                base64,
                width: dimensions.width,
                height: dimensions.height
            };
        });

        // <<<<<<<<<<<<<<<<<<<<< CÓDIGO CORREGIDO PARA PDFMAKE >>>>>>>>>>>>>>>>>>>>>>>
        
        // <<<<<<<<<<<<<<<<<<<<< CÓDIGO PARA MANTENER TAMAÑO ORIGINAL CON DIMENSIONES REALES >>>>>>>>>>>>>>>>>>>>>>>
        
        // Configuración para mantener tamaño original de imágenes con dimensiones reales
        const documentDefinition = {
            pageMargins: [0, 0, 0, 0],
            content: imagesData.map((imageData, index) => {
                return {
                    image: imageData.base64,
                    // Usar dimensiones reales (convertir de píxeles a puntos: 1px ≈ 0.75pt)
                    width: imageData.width * 0.75,
                    height: imageData.height * 0.75,
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };
            }),
            // Definir tamaño de página basado en la primera imagen
            pageSize: {
                width: imagesData[0].width * 0.75,
                height: imagesData[0].height * 0.75
            }
        };
        
        // Creamos el PDF
        const printer = new pdfMake({});
        const pdfDoc = printer.createPdfKitDocument(documentDefinition);

        // Convertimos el PDF a un buffer para enviarlo en la respuesta
        const pdfBuffer = await new Promise(resolve => {
            const chunks = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.end();
        });

        // <<<<<<<<<<<<<<<<<<<<< FIN DEL CÓDIGO CORREGIDO >>>>>>>>>>>>>>>>>>>>>>>

        log('PDF creado con éxito. Enviando respuesta...');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_final.pdf"');
        
        res.send(pdfBuffer);
        
    } catch (error) {
        log('🔴 Error crítico en el flujo de procesamiento.', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor. Por favor, revise el log para más detalles.',
            logs: debugLogs
        });
    }
};