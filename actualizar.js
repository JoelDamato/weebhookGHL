const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

// Conexión a MongoDB
require('./src/db');
const Contacto = require('./src/models/contacto');

// Cambia el nombre del archivo CSV aquí
const CSV_FILE = path.join(__dirname, 'actualizar.csv');

// Asume que el CSV tiene columnas: ghl_id, notion_id
async function actualizarNotionIds() {
  const updates = [];

  fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', (row) => {
      const ghl_id = row.ghl_id || row.contact_id;
      const notion_id = row.notion_id;
      if (ghl_id && notion_id) {
        updates.push({ ghl_id, notion_id });
      }
    })
    .on('end', async () => {
      for (const { ghl_id, notion_id } of updates) {
        try {
          const result = await Contacto.findOneAndUpdate(
            { contact_id: ghl_id },
            { $set: { notion_id } },
            { new: true }
          );
          if (result) {
            console.log(`✅ Actualizado: ${ghl_id} → notion_id: ${notion_id}`);
          } else {
            console.log(`❌ No encontrado en Mongo: ${ghl_id}`);
          }
        } catch (err) {
          console.error(`❌ Error actualizando ${ghl_id}:`, err);
        }
      }
      mongoose.connection.close();
    });
}

actualizarNotionIds();
