require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Contacto = require('./src/models/contacto');

// Cambia el nombre del archivo CSV aquí (debe tener columna mongo_id)
const CSV_FILE = path.join(__dirname, 'todos_mongo_id.csv');

async function purificarMongoPorCSV() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Lee los IDs del CSV (asume columna: mongo_id, con header)
  const ids = fs.readFileSync(CSV_FILE, 'utf8')
    .split('\n')
    .slice(1)
    .map(line => line.split(',')[1]?.replace(/"/g, '').trim())
    .filter(Boolean);

  if (!ids.length) {
    console.log('No se encontraron IDs en el CSV.');
    mongoose.connection.close();
    return;
  }

  // Borra todos los que NO estén en la lista de IDs
  const result = await Contacto.deleteMany({ _id: { $nin: ids } });
  console.log(`Eliminados: ${result.deletedCount} registros que no están en el CSV. Quedan solo los IDs del CSV.`);

  mongoose.connection.close();
}

purificarMongoPorCSV();
