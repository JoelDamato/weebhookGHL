// controllers/iaWebhookPdfController.js

const { convert } = require('image-to-pdf');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

exports.handleIaWebhookPdf = async (req, res) => {
    // Array para almacenar todos los logs
    const debugLogs = [];

    const log = (message, data = null) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message: message,
            data: data
        };
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
            // Añadimos un catch individual para registrar errores de descarga
            .catch(error => {
                log(`Error de descarga para la URL: ${url}`, {
                    status: error.response ? error.response.status : 'No response',
                    statusText: error.response ? error.response.statusText : 'Network error'
                });
                return Promise.reject(error); // Rechazamos la promesa para que Promise.all falle
            })
        );
        
        const responses = await Promise.all(downloadPromises);
        const imagesBuffers = responses.map(response => Buffer.from(response.data));

        log('Descarga de imágenes completada. Creando PDF...');

        const conversionOptions = {
            pageSize: 'A4',
            pageMargins: [0, 0, 0, 0]
        };

        let pdfBuffer = await new Promise((resolve, reject) => {
            const buffers = [];
            convert(imagesBuffers, conversionOptions)
                .on('data', chunk => buffers.push(chunk))
                .on('end', () => resolve(Buffer.concat(buffers)))
                .on('error', reject);
        });

        log('PDF creado con éxito. Enviando respuesta...');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_final.pdf"');
        
        res.send(pdfBuffer);
        
    } catch (error) {
        log('🔴 Error crítico en el flujo de procesamiento.', {
            message: error.message,
            stack: error.stack
        });
        // Devolvemos los logs como un JSON en caso de error
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor. Por favor, revise el log para más detalles.',
            logs: debugLogs
        });
    }
};