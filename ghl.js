require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Contacto = require('./src/models/contacto');

const csvFile = './conctactGHL.csv';

async function main() {
  // 1. Leer Contact Ids del CSV
  const csvContactIds = [];
  const csvPhones = [];
  const phoneToIds = {}; // Para mapear phone -> [ids]
  fs.createReadStream(csvFile)
    .pipe(csv())
    .on('data', (row) => {
      if (row['Contact Id']) csvContactIds.push(row['Contact Id']);
      if (row['Phone']) {
        csvPhones.push(row['Phone']);
        // Mapear phone a ids para detectar duplicados de phone con distintos ids
        if (!phoneToIds[row['Phone']]) phoneToIds[row['Phone']] = [];
        if (row['Contact Id']) phoneToIds[row['Phone']].push(row['Contact Id']);
      }
    })
    .on('end', async () => {
      // Detectar IDs repetidos en el CSV
      const seenIds = new Set();
      const duplicatesIds = [];
      for (const id of csvContactIds) {
        if (seenIds.has(id)) duplicatesIds.push(id);
        else seenIds.add(id);
      }
      if (duplicatesIds.length > 0) {
        console.log('IDs repetidos en el CSV:', duplicatesIds);
      } else {
        console.log('No hay IDs repetidos en el CSV.');
      }

      // Detectar teléfonos repetidos en el CSV
      const seenPhones = new Set();
      const duplicatesPhones = [];
      for (const phone of csvPhones) {
        if (phone && seenPhones.has(phone)) duplicatesPhones.push(phone);
        else if (phone) seenPhones.add(phone);
      }
      if (duplicatesPhones.length > 0) {
        console.log('Phones repetidos en el CSV:', duplicatesPhones);
      } else {
        console.log('No hay Phones repetidos en el CSV.');
      }

      // Detectar teléfonos que tienen más de un Contact Id asociado en el CSV
      const phonesWithMultipleIds = Object.entries(phoneToIds)
        .filter(([_, ids]) => ids.length > 1)
        .map(([phone, ids]) => ({ phone, ids }));
      if (phonesWithMultipleIds.length > 0) {
        console.log('Phones con más de un Contact Id asociado en el CSV:');
        phonesWithMultipleIds.forEach(({ phone, ids }) => {
          console.log(`Phone: ${phone} -> Contact Ids: ${ids.join(', ')}`);
        });
      } else {
        console.log('No hay phones con más de un Contact Id asociado en el CSV.');
      }

      // 2. Conectar a Mongo y obtener Contact Ids existentes
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      const mongoContacts = await Contacto.find({ contact_id: { $in: csvContactIds } }, { contact_id: 1, phone: 1, _id: 1, date_created: 1, createdAt: 1 });
      const mongoContactIds = new Set(mongoContacts.map(c => c.contact_id)); // <-- agrega esta línea

      // Detectar teléfonos que tienen más de un Contacto en Mongo
      const phoneToContacts = {};
      mongoContacts.forEach(c => {
        if (c.phone) {
          if (!phoneToContacts[c.phone]) phoneToContacts[c.phone] = [];
          phoneToContacts[c.phone].push(c);
        }
      });

      const phonesWithDuplicates = Object.entries(phoneToContacts)
        .filter(([_, arr]) => arr.length > 1);

      if (phonesWithDuplicates.length > 0) {
        console.log('Eliminando contactos más viejos para phones duplicados en Mongo...');
        for (const [phone, contacts] of phonesWithDuplicates) {
          // Ordenar por fecha de creación (date_created o createdAt)
          contacts.sort((a, b) => {
            const da = a.date_created || a.createdAt || a._id.getTimestamp();
            const db = b.date_created || b.createdAt || b._id.getTimestamp();
            return da - db;
          });
          // Mantener el más nuevo, borrar los demás
          const toDelete = contacts.slice(0, -1);
          for (const c of toDelete) {
            await Contacto.deleteOne({ _id: c._id });
            console.log(`Borrado contacto duplicado: _id=${c._id}, phone=${phone}`);
          }
        }
      } else {
        console.log('No hay phones duplicados en Mongo para borrar.');
      }

      // 3. Filtrar los que NO están en Mongo
      const missing = csvContactIds.filter(id => !mongoContactIds.has(id));
      console.log('IDs faltantes en Mongo:', missing);

      // IDs que sobran en Mongo (están en Mongo pero no en el CSV)
      const csvContactIdsSet = new Set(csvContactIds);
      const sobrantes = Array.from(mongoContactIds).filter(id => !csvContactIdsSet.has(id));
      console.log('IDs que sobran en Mongo:', sobrantes);

      // Detectar teléfonos duplicados en Mongo
      const phoneCount = {};
      mongoContacts.forEach(c => {
        if (c.phone) {
          phoneCount[c.phone] = (phoneCount[c.phone] || 0) + 1;
        }
      });
      const mongoPhoneDuplicates = Object.entries(phoneCount)
        .filter(([_, count]) => count > 1)
        .map(([phone]) => phone);
      if (mongoPhoneDuplicates.length > 0) {
        console.log('Phones duplicados en Mongo:', mongoPhoneDuplicates);
      } else {
        console.log('No hay Phones duplicados en Mongo.');
      }

      // 4. Escribir a CSV
      const output = ['Contact Id', ...missing].join('\n');
      fs.writeFileSync('missing_ghl_contacts.csv', output, 'utf8');
      console.log(`Listo. ${missing.length} Contact Ids faltantes exportados a missing_ghl_contacts.csv`);
      process.exit(0);
    });
}

main();
