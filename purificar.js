require('dotenv').config();
const mongoose = require('mongoose');
const Contacto = require('./src/models/contacto');
const fs = require('fs');
const path = require('path');

// --- NUEVO BLOQUE: Mostrar contact_id (ghl_id) que SOBRAN en Mongo y NO están en el CSV ---
async function mostrarContactIdsQueSobran() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Obtiene todos los contact_id (ghl_id) de Mongo
  const contactos = await Contacto.find({ contact_id: { $exists: true, $ne: null, $ne: "" } }, { contact_id: 1 }).lean();
  const mongoContactIds = contactos.map(c => String(c.contact_id).trim());

  // Lee los contact_id válidos del CSV y los guarda en un Set para comparación eficiente
  const csvFile = path.join(__dirname, 'conctactGHL.csv');
  const csvLines = fs.readFileSync(csvFile, 'utf8').split('\n').slice(1);
  const csvContactIdSet = new Set(
    csvLines
      .map(line => line.split(',')[0]?.replace(/"/g, '').trim())
      .filter(Boolean)
  );

  // Busca los contact_id que están en Mongo pero no en el CSV
  const sobrantes = mongoContactIds.filter(id => !csvContactIdSet.has(id));

  if (sobrantes.length) {
    console.log('contact_id (ghl_id) que SOBRAN en Mongo y NO están en el CSV:');
    sobrantes.forEach(id => console.log(id));
  } else {
    console.log('No hay contact_id sobrantes en Mongo.');
  }

  mongoose.connection.close();
}

// Ejecuta la función para mostrar los contact_id sobrantes
mostrarContactIdsQueSobran();
