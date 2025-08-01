// controllers/iaWebhookPdfController.js

const pdfMake = require('pdfmake');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

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
                validateStatus: status => status === 200,
                timeout: 30000 // Timeout de 30 segundos
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

        // Convertimos los buffers a base64 para pdfmake
        const imagesBase64 = responses.map(response => {
            const buffer = Buffer.from(response.data);
            return `data:${response.headers['content-type']};base64,${buffer.toString('base64')}`;
        });

        log('Imágenes convertidas a base64. Configurando documento PDF...');

        // <<<<<<<<<<<<<<<<<<<<< CONFIGURACIONES OPTIMIZADAS PARA CERTIFICADOS >>>>>>>>>>>>>>>>>>>>>>>

        // OPCIÓN 1: Para certificados que ocupen casi toda la página (RECOMENDADA)
        const documentDefinition = {
            pageSize: 'A4',
            pageMargins: [15, 15, 15, 15], // Márgenes muy pequeños
            content: imagesBase64.map((base64Image, index) => {
                return {
                    image: base64Image,
                    fit: [565, 810], // Ocupa casi toda la página A4
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };
            })
        };

        // OPCIÓN 2: Para certificados con márgenes estándar
        /*
        const documentDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 30, 40, 30],
            content: imagesBase64.map((base64Image, index) => {
                return {
                    image: base64Image,
                    fit: [515, 780],
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };
            })
        };
        */

        // OPCIÓN 3: Para certificados en formato apaisado (horizontal)
        /*
        const documentDefinition = {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [20, 20, 20, 20],
            content: imagesBase64.map((base64Image, index) => {
                return {
                    image: base64Image,
                    fit: [800, 555],
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };
            })
        };
        */

        // OPCIÓN 4: Sin restricciones de tamaño (tamaño original)
        /*
        const documentDefinition = {
            pageSize: 'A4',
            pageMargins: [20, 20, 20, 20],
            content: imagesBase64.map((base64Image, index) => {
                return {
                    image: base64Image,
                    // Sin fit, width o height = tamaño original (puede salirse de la página)
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };
            })
        };
        */

        log('Configuración del documento completada. Generando PDF...');
        
        // Creamos el PDF con configuración optimizada
        const printer = new pdfMake({});
        const pdfDoc = printer.createPdfKitDocument(documentDefinition);

        // Convertimos el PDF a un buffer para enviarlo en la respuesta
        const pdfBuffer = await new Promise((resolve, reject) => {
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
        });

        log(`PDF creado con éxito. Tamaño: ${pdfBuffer.length} bytes`);

        // Configuramos headers para la respuesta
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