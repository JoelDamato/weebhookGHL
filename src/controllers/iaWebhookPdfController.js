// controllers/iaWebhookPdfController.js

const { convert } = require('image-to-pdf');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

exports.handleIaWebhookPdf = async (req, res) => {
    try {
        // Extraemos las URLs de las imágenes del cuerpo de la petición.
        const { Imagen1, Imagen2, Imagen3, Imagen4 } = req.body;
        const imageUrls = [ Imagen1, Imagen2, Imagen3, Imagen4 ];

        if (!imageUrls.every(url => url && typeof url === 'string')) {
            return res.status(400).send('Se esperan 4 URLs de imagen válidas.');
        }

        console.log('Recibidas 4 URLs de imágenes, descargando...');

        // Descargamos las imágenes de forma paralela
        const downloadPromises = imageUrls.map(url =>
            axios.get(url, {
                responseType: 'arraybuffer'
            })
        );
        const responses = await Promise.all(downloadPromises);
        const imagesBuffers = responses.map(response => Buffer.from(response.data));

        console.log('Descarga de imágenes completada, creando PDF...');

        // <<<<< CAMBIO CLAVE >>>>>
        // Configuramos la conversión de forma estática para que la imagen ocupe toda la página.
        // Aquí pasamos las opciones de configuración directamente a la función convert.
        const conversionOptions = {
            pageSize: 'A4',
            pageMargins: [0, 0, 0, 0] // Margen superior, derecha, inferior, izquierda
        };

        let pdfBuffer = await new Promise((resolve, reject) => {
            const buffers = [];
            convert(imagesBuffers, conversionOptions) // Pasamos las opciones aquí
                .on('data', chunk => buffers.push(chunk))
                .on('end', () => resolve(Buffer.concat(buffers)))
                .on('error', reject);
        });

        console.log('PDF creado con éxito.');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte_final.pdf"');
        
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Error en el webhook de PDF:', error);
        res.status(500).send('Error interno del servidor');
    }
};