require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const registrosNoEncontrados = [];

async function obtenerTodasLasPaginas() {
  let results = [];
  let cursor = undefined;

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });

    results = results.concat(response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

async function agregarRelacion(pageId, nuevoRelacionId) {
  try {
    const pagina = await notion.pages.retrieve({ page_id: pageId });
    const relacionesActuales =
      pagina.properties["Cliente antiguo"]?.relation || [];

    const yaExiste = relacionesActuales.some((r) => r.id === nuevoRelacionId);

    if (yaExiste) {
      console.log(`🔁 El ID ${nuevoRelacionId} ya estaba relacionado en la página ${pageId}`);
      return;
    }

    const nuevasRelaciones = [...relacionesActuales, { id: nuevoRelacionId }];

    await notion.pages.update({
      page_id: pageId,
      properties: {
        "Cliente antiguo": {
          relation: nuevasRelaciones
        }
      }
    });

    console.log(`✅ Relación agregada correctamente a la página ${pageId}`);
  } catch (error) {
    console.error("❌ Error actualizando relación:", error.message);
  }
}

async function procesarCSV() {
  const results = [];

  fs.createReadStream("name.csv")
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      console.log("📥 Procesando archivo CSV...");
      const paginas = await obtenerTodasLasPaginas();
      console.log(`🔎 Se encontraron ${paginas.length} páginas en la base.`);

      for (const row of results) {
        const ultimos8 = row["Telefono"]?.toString().trim();
        const idParaRelacionar = row["Id"]?.trim();

        if (!ultimos8 || !idParaRelacionar) {
          console.log("⚠️ Fila incompleta, se omite:", row);
          continue;
        }

        const coincidencias = paginas.filter((pagina) => {
          const telefonoProp = pagina.properties["Telefono"];
          const telefonoValue = telefonoProp?.phone_number || "";
          return telefonoValue.endsWith(ultimos8);
        });

        console.log(`➡️ ${coincidencias.length} coincidencias para ${ultimos8}`);

        if (coincidencias.length === 0) {
          registrosNoEncontrados.push({ telefono: ultimos8, id: idParaRelacionar });
          continue;
        }

        for (const pagina of coincidencias) {
          await agregarRelacion(pagina.id, idParaRelacionar);
        }
      }

      if (registrosNoEncontrados.length > 0) {
        const header = "telefono,id\n";
        const body = registrosNoEncontrados
          .map((r) => `${r.telefono},${r.id}`)
          .join("\n");

        fs.writeFileSync("no_encontrados.csv", header + body, "utf8");
        console.log("📁 Archivo no_encontrados.csv generado con registros no encontrados.");
      } else {
        console.log("🎉 Todos los registros fueron actualizados correctamente.");
      }
    });
}

procesarCSV();
