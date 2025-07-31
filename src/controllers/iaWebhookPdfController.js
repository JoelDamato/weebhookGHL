// controllers/iaWebhookPdfController.js

const { convert } = require('image-to-pdf');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

exports.handleIaWebhookPdf = async (req, res) => {
    try {
        // Extraemos las URLs de las imágenes del cuerpo de la petición.
        // Nos aseguramos de que coincidan con la mayúscula y minúsculas exactas.
        const imageUrls = [
            req.body.Imagen1,
            req.body.imagen2,
            req.body.imagen3,
            req.body.imagen4
        ];

        // Verificamos que todas las URLs sean válidas antes de continuar
        if (!imageUrls.every(url => url && typeof url === 'string')) {
            return res.status(400).send('Se esperan 4 URLs de imagen válidas.');
        }

        console.log('Recibidas 4 URLs de imágenes, descargando...');

        // Descargamos las imágenes de forma paralela para mayor eficiencia
        const downloadPromises = imageUrls.map(url =>
            axios.get(url, {
                responseType: 'arraybuffer' // Aseguramos que la respuesta sea un buffer de datos
            })
        );

        // Esperamos a que todas las descargas se completen
        const responses = await Promise.all(downloadPromises);
        const imagesBuffers = responses.map(response => Buffer.from(response.data));

        console.log('Descarga de imágenes completada, creando PDF...');

        // Creamos un buffer del PDF en memoria
        let pdfBuffer = await new Promise((resolve, reject) => {
            const buffers = [];
            convert(imagesBuffers, 'A4')
                .on('data', chunk => buffers.push(chunk))
                .on('end', () => resolve(Buffer.concat(buffers)))
                .on('error', reject);
        });

        console.log('PDF creado con éxito.');

        // Enviamos el PDF como respuesta a la petición de n8n
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_final.pdf"');
        
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Error en el webhook de PDF:', error);
        res.status(500).send('Error interno del servidor');
    }
};