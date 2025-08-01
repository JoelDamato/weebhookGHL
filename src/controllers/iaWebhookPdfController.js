// controllers/iaWebhookPdfController.js

const axios = require('axios');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');

exports.handleIaWebhookPdf = async (req, res) => {
    const debugLogs = [];
    const log = (message, data = null) => {
        const logEntry = { timestamp: new Date().toISOString(), message, data };
        debugLogs.push(logEntry);
        console.log(`[LOG] ${message}`, data);
    };

    try {
        log('Iniciando el procesamiento del webhook...');
        const { Imagen1, Imagen2, Imagen3, Imagen4 } = req.body;
        const imageUrls = [Imagen1, Imagen2, Imagen3, Imagen4];

        if (!imageUrls.every(url => url && typeof url === 'string')) {
            return res.status(400).send('Se esperan 4 URLs de imagen válidas.');
        }

        const responses = await Promise.all(imageUrls.map(url =>
            axios.get(url, { responseType: 'arraybuffer' })
        ));

        const pdfDoc = await PDFDocument.create();

        for (let i = 0; i < responses.length; i++) {
    const resized = await sharp(responses[i].data)
        .resize({ width: 1240 }) // SOLO ancho fijo
        .jpeg({ quality: 90 })
        .toBuffer();

    const metadata = await sharp(resized).metadata();

    const image = await pdfDoc.embedJpg(resized);
    const page = pdfDoc.addPage([1240, metadata.height]); // Ajustamos el alto real

    page.drawImage(image, {
        x: 0,
        y: 0,
        width: 1240,
        height: metadata.height,
    });
}


        const pdfBytes = await pdfDoc.save();

        log(`PDF generado exitosamente. Tamaño: ${pdfBytes.length} bytes`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="certificados_reporte.pdf"');
        res.setHeader('Content-Length', pdfBytes.length);
        res.send(Buffer.from(pdfBytes));
        
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
