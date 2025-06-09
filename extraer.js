require("dotenv").config();
const { Client } = require("@notionhq/client");
const fs = require("fs");
const path = require("path");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function exportarSinMongoId() {
  let hasMore = true;
  let startCursor = undefined;
  const sinMongoIds = [];
  let total = 0;
  let pageCount = 0;

  while (hasMore) {
    console.log(`Consultando página de Notion... (page ${pageCount + 1})`);
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
      page_size: 100,
    });

    for (const page of response.results) {
      const mongoIdProp = page.properties["mongo_id"];
      const mongoId = mongoIdProp?.rich_text?.[0]?.plain_text;
      if (!mongoId) {
        sinMongoIds.push({ pageId: page.id });
      }
      total++;
      if (total % 100 === 0) {
        console.log(`Llevamos ${total} registros procesados...`);
      }
    }

    hasMore = response.has_more;
    startCursor = response.next_cursor;
    pageCount++;
    console.log(`Procesadas ${total} filas hasta ahora...`);
  }

  console.log(`\nTotal de páginas SIN mongo_id: ${sinMongoIds.length}`);
  // Exporta a un CSV
  const csvLines = ['page_id'].concat(
    sinMongoIds.map(r => `"${r.pageId}"`)
  );
  const filePath = path.join(__dirname, "sin_mongo_id.csv");
  fs.writeFileSync(filePath, csvLines.join('\n'), "utf8");
  console.log(`📄 Archivo ${filePath} generado con ${sinMongoIds.length} registros.`);
}

exportarSinMongoId();
