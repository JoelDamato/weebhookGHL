require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function encontrarDuplicadosPorGhlId() {
  let hasMore = true;
  let startCursor = undefined;
  const ghlIdMap = {};
  let total = 0;
  let pageCount = 0;

  // Recorre toda la base de datos de Notion, página por página
  while (hasMore) {
    console.log(`Consultando página de Notion... (page ${pageCount + 1})`);
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      page_size: 100,
    });

    for (const page of response.results) {
      // El campo ghl_id está en la propiedad contact_id como rich_text
      const props = page.properties;
      const ghlId = props?.contact_id?.rich_text?.[0]?.plain_text;
      if (ghlId) {
        if (!ghlIdMap[ghlId]) ghlIdMap[ghlId] = [];
        ghlIdMap[ghlId].push(page.id);
      }
      total++;
    }

    hasMore = response.has_more;
    startCursor = response.next_cursor;
    pageCount++;
    console.log(`Procesadas ${total} filas hasta ahora...`);
  }

  const duplicados = Object.entries(ghlIdMap).filter(([_, ids]) => ids.length > 1);

  if (duplicados.length === 0) {
    console.log('✅ No hay contactos duplicados por ghl_id en Notion.');
    return;
  }

  console.log(`❗ Encontrados ${duplicados.length} ghl_id duplicados en Notion:\n`);
  const csvLines = ['ghl_id,page_ids'];
  duplicados.forEach(([ghlId, ids]) => {
    console.log(`ghl_id: ${ghlId} (${ids.length} veces)`);
    ids.forEach(id => console.log('  → pageId:', id));
    csvLines.push(`"${ghlId}","${ids.join(';')}"`);
    console.log('---');
  });

  const csvPath = path.join(__dirname, 'duplicados_notion.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
  console.log(`\nArchivo CSV generado: ${csvPath}`);
}

encontrarDuplicadosPorGhlId().catch(err => {
  console.error('❌ Error consultando Notion:', err.message);
});
