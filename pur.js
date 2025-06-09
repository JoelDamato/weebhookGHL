require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const mongoose = require('mongoose');
const Contacto = require('./src/models/contacto');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Cambia el nombre del archivo CSV aquí
const CSV_FILE = path.join(__dirname, 'sin_mongo_id.csv');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // 1. Lee los page_id del CSV
  const pageIds = fs.readFileSync(CSV_FILE, 'utf8')
    .split('\n')
    .slice(1)
    .map(line => line.replace(/"/g, '').trim())
    .filter(Boolean);

  console.log(`Procesando ${pageIds.length} páginas de Notion...`);

  for (const pageId of pageIds) {
    try {
      // 2. Trae todos los datos de la página de Notion
      const page = await notion.pages.retrieve({ page_id: pageId });
      const props = page.properties;

      // 3. Mapea los datos de Notion a un objeto para Mongo
      let tags = (props["Etiqueta"]?.multi_select || []).map(t => t.name);
      // Si tags es un array vacío, guárdalo como string vacío para que el schema lo acepte
      if (Array.isArray(tags)) {
        if (tags.length === 0) tags = "";
        else if (tags.length === 1) tags = tags[0];
        // Si hay más de uno, únelos por coma (o ajusta según tu preferencia)
        else tags = tags.join(', ');
      }

      const contactoData = {
        full_name: props["Nombre completo"]?.title?.[0]?.plain_text || "",
        first_name: props["Nombre"]?.rich_text?.[0]?.plain_text || "",
        last_name: props["Apellido"]?.rich_text?.[0]?.plain_text || "",
        phone: props["Telefono"]?.phone_number || "",
        email: props["Mail"]?.email || "",
        contact_id: props["ghl_id"]?.rich_text?.[0]?.plain_text || "",
        tags, // <-- ahora es string o vacío
        Temperatura: props["Temperatura"]?.select?.name || "",
        Embudo_1: props["Embudo_1"]?.select?.name || "",
        Estrategia: props["Estrategia"]?.multi_select?.map(e => e.name) || [],
        Mensualidad: props["Mensualidad"]?.multi_select?.map(e => e.name) || [],
        Recursos: props["Recursos"]?.multi_select?.map(e => e.name) || [],
        Productos_adquiridos: props["Productos_adquiridos"]?.multi_select?.map(e => e.name) || [],
        Sub_productos: props["Sub_productos"]?.multi_select?.map(e => e.name) || [],
        Ultimo_contacto: props["Ultimo_contacto"]?.date?.start || null,
        utm_campaign: props["utm_campaign"]?.rich_text?.[0]?.plain_text || "",
        utm_content: props["utm_content"]?.rich_text?.[0]?.plain_text || "",
        utm_medium: props["utm_medium"]?.rich_text?.[0]?.plain_text || "",
        utm_source: props["utm_source"]?.rich_text?.[0]?.plain_text || "",
        utm_term: props["utm_term"]?.rich_text?.[0]?.plain_text || "",
        fbclid: props["fbclid"]?.rich_text?.[0]?.plain_text || "",
        notion_id: pageId
      };

      // 4. Crea el contacto en Mongo
      const nuevoContacto = new Contacto(contactoData);
      await nuevoContacto.save();

      // 5. Actualiza el mongo_id en Notion
      await notion.pages.update({
        page_id: pageId,
        properties: {
          mongo_id: {
            rich_text: [{ text: { content: String(nuevoContacto._id) } }]
          }
        }
      });

      console.log(`✅ Creado en Mongo y actualizado mongo_id en Notion: ${pageId} → ${nuevoContacto._id}`);
    } catch (err) {
      console.error(`❌ Error con pageId ${pageId}:`, err.message);
    }
  }

  mongoose.connection.close();
  console.log('✔️ Proceso terminado.');
}

main();
