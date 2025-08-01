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

        // Convertimos los buffers a base64 para pdfmake
        const imagesBase64 = responses.map(response => {
            const buffer = Buffer.from(response.data);
            return `data:${response.headers['content-type']};base64,${buffer.toString('base64')}`;
        });

        // <<<<<<<<<<<<<<<<<<<<< CÓDIGO CORREGIDO PARA PDFMAKE >>>>>>>>>>>>>>>>>>>>>>>
        
        // Definimos las dimensiones de la página A4 en puntos
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margins = 20; // Margen pequeño para evitar cortes
        const maxWidth = pageWidth - (margins * 2);
        const maxHeight = pageHeight - (margins * 2);

        // Objeto de definición del documento PDF
        const documentDefinition = {
            pageSize: 'A4',
            pageMargins: [margins, margins, margins, margins], // Márgenes pequeños
            content: imagesBase64.map((base64Image, index) => {
                // OPCIÓN 1: Ajustar proporcionalmente (recomendado)
                const imageObject = {
                    image: base64Image,
                    fit: [maxWidth, maxHeight], // Ajusta la imagen manteniendo proporción
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };

                /* OPCIÓN 2: Si quieres que las imágenes ocupen todo el ancho
                const imageObject = {
                    image: base64Image,
                    width: maxWidth,
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };
                */

                /* OPCIÓN 3: Si quieres que las imágenes ocupen toda la altura
                const imageObject = {
                    image: base64Image,
                    height: maxHeight,
                    alignment: 'center',
                    pageBreak: index > 0 ? 'before' : null
                };
                */

                return imageObject;
            })
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