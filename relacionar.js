require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

const registrosNoEncontrados = [];

async function buscarPaginaPorNombre(nombre) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Nombre completo",
      title: {
        equals: nombre.trim()
      }
    }
  });

  return response.results[0];
}

async function actualizarRelacion(pageId, relacionId) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        "Cliente antiguo": {
          relation: [{ id: relacionId }]
        }
      }
    });
    console.log(`✅ Relación actualizada para ${pageId}`);
  } catch (error) {
    console.error("❌ Error actualizando relación:", error);
  }
}

function procesarCSV() {
  const results = [];

  fs.createReadStream("name.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      for (const row of results) {
        const nombre = row["nombre"];
        const idParaRelacionar = row["id"];

        if (!nombre || !idParaRelacionar) continue;

        try {
          const pagina = await buscarPaginaPorNombre(nombre);

          if (pagina) {
            await actualizarRelacion(pagina.id, idParaRelacionar);
          } else {
            console.log(`⚠️ No encontrado: ${nombre}`);
            registrosNoEncontrados.push({ nombre, idParaRelacionar });
          }
        } catch (err) {
          console.error("❌ Error procesando fila:", err);
        }
      }

      // Guardar CSV de no encontrados
      if (registrosNoEncontrados.length > 0) {
        const header = "nombre,idParaRelacionar\n";
        const body = registrosNoEncontrados
          .map((r) => `${r.nombre},${r.idParaRelacionar}`)
          .join("\n");

        fs.writeFileSync("no_encontrados.csv", header + body, "utf8");
        console.log("📁 Archivo no_encontrados.csv generado.");
      } else {
        console.log("🎉 Todos los registros fueron actualizados correctamente.");
      }
    });
}

procesarCSV();
