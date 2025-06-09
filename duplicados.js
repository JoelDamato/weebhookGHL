require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function exportarDuplicadosPorTelefono() {
  let hasMore = true;
  let startCursor = undefined;
  const phoneMap = {};
  let total = 0;
  let pageCount = 0;

  // 1. Recorre toda la base de datos y agrupa por teléfono
  while (hasMore) {
    console.log(`Consultando página de Notion... (page ${pageCount + 1})`);
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      page_size: 100,
    });

    for (const page of response.results) {
      const props = page.properties;
      const telefono = props?.Telefono?.phone_number;
      if (telefono) {
        if (!phoneMap[telefono]) phoneMap[telefono] = [];
        phoneMap[telefono].push(page.id);
      }
      total++;
    }

    hasMore = response.has_more;
    startCursor = response.next_cursor;
    pageCount++;
    console.log(`Procesadas ${total} filas hasta ahora...`);
  }

  // 2. Detecta duplicados y exporta a CSV
  const duplicados = Object.entries(phoneMap).filter(([_, ids]) => ids.length > 1);
  console.log(`\n🔎 Se encontraron ${duplicados.length} teléfonos duplicados en la base de datos de Notion.\n`);

  const csvLines = ['telefono,page_ids'];
  duplicados.forEach(([telefono, ids]) => {
    csvLines.push(`"${telefono}","${ids.join(';')}"`);
  });

  const csvPath = path.join(__dirname, 'duplicados_telefono_notion.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
  console.log(`\nCSV generado: ${csvPath}`);
}

exportarDuplicadosPorTelefono().catch(err => {
  console.error('❌ Error consultando Notion:', err.message);
});
