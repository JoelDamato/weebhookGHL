require('dotenv').config();
const fs = require('fs');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function getAllPages() {
  let results = [];
  let cursor = undefined;
  let pageCount = 0;
  do {
    console.log(`Consultando Notion... cursor: ${cursor || 'inicio'}`);
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    results = results.concat(response.results);
    pageCount += response.results.length;
    console.log(`Páginas obtenidas hasta ahora: ${pageCount}`);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  console.log(`Total de páginas obtenidas de Notion: ${results.length}`);
  return results;
}

function getProp(page, prop) {
  const p = page.properties[prop];
  if (!p) return undefined;
  if (p.type === 'phone_number') return p.phone_number;
  if (p.type === 'rich_text') return p.rich_text[0]?.plain_text;
  if (p.type === 'title') return p.title[0]?.plain_text;
  if (p.type === 'unique_id') return p.unique_id?.number;
  return p[p.type];
}

async function main() {
  console.log('Iniciando revisión de duplicados en Notion...');
  const pages = await getAllPages();

  // Extraer valores
  const phoneMap = {};
  const mongoIdMap = {};
  const ghlIdMap = {};

  pages.forEach(page => {
    const id = page.id;
    const phone = getProp(page, 'Telefono');
    const mongo_id = getProp(page, 'mongo_id');
    const ghl_id = getProp(page, 'ghl_id');

    // Mostrar lo que se está extrayendo
    console.log(`Página: ${id} | phone: ${phone} | mongo_id: ${mongo_id} | ghl_id: ${ghl_id}`);

    if (phone) {
      if (!phoneMap[phone]) phoneMap[phone] = [];
      phoneMap[phone].push(id);
    }
    if (mongo_id) {
      if (!mongoIdMap[mongo_id]) mongoIdMap[mongo_id] = [];
      mongoIdMap[mongo_id].push(id);
    }
    if (ghl_id) {
      if (!ghlIdMap[ghl_id]) ghlIdMap[ghl_id] = [];
      ghlIdMap[ghl_id].push(id);
    }
  });

  // Buscar duplicados
  const phoneDuplicates = Object.entries(phoneMap).filter(([_, ids]) => ids.length > 1);
  const mongoIdDuplicates = Object.entries(mongoIdMap).filter(([_, ids]) => ids.length > 1);
  const ghlIdDuplicates = Object.entries(ghlIdMap).filter(([_, ids]) => ids.length > 1);

  // Mostrar en consola
  if (phoneDuplicates.length > 0) {
    console.log('Phones duplicados en Notion:');
    phoneDuplicates.forEach(([phone, ids]) => {
      console.log(`Phone: ${phone} -> Page IDs: ${ids.join(', ')}`);
    });
  } else {
    console.log('No hay phones duplicados en Notion.');
  }

  if (mongoIdDuplicates.length > 0) {
    console.log('mongo_id duplicados en Notion:');
    mongoIdDuplicates.forEach(([mongo_id, ids]) => {
      console.log(`mongo_id: ${mongo_id} -> Page IDs: ${ids.join(', ')}`);
    });
  } else {
    console.log('No hay mongo_id duplicados en Notion.');
  }

  if (ghlIdDuplicates.length > 0) {
    console.log('ghl_id duplicados en Notion:');
    ghlIdDuplicates.forEach(([ghl_id, ids]) => {
      console.log(`ghl_id: ${ghl_id} -> Page IDs: ${ids.join(', ')}`);
    });
  } else {
    console.log('No hay ghl_id duplicados en Notion.');
  }

  // Escribir CSV
  const rows = [];
  rows.push('type,value,page_ids');
  phoneDuplicates.forEach(([phone, ids]) => {
    rows.push(`phone,"${phone}","${ids.join('|')}"`);
  });
  mongoIdDuplicates.forEach(([mongo_id, ids]) => {
    rows.push(`mongo_id,"${mongo_id}","${ids.join('|')}"`);
  });
  ghlIdDuplicates.forEach(([ghl_id, ids]) => {
    rows.push(`ghl_id,"${ghl_id}","${ids.join('|')}"`);
  });

  fs.writeFileSync('notion_duplicates.csv', rows.join('\n'), 'utf8');
  console.log('CSV de duplicados generado: notion_duplicates.csv');
}

main();
