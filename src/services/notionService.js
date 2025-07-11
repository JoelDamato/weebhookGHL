const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

function mapDataToNotionProperties(data) {
  return {
    "Nombre completo": data.full_name
      ? { title: [{ text: { content: data.full_name } }] }
      : undefined,

    "Nombre": data.first_name
      ? { rich_text: [{ text: { content: data.first_name } }] }
      : undefined,

    "Apellido": data.last_name
      ? { rich_text: [{ text: { content: data.last_name } }] }
      : undefined,

    Telefono: data.phone
      ? { phone_number: data.phone }
      : undefined,

  Etiqueta: Array.isArray(data.tags)
  ? { multi_select: data.tags.map(tag => ({ name: tag })) }
  : data.tags
    ? { multi_select: [{ name: data.tags }] } // por si llega un solo string
    : undefined,


    ghl_id: data.contact_id
      ? { rich_text: [{ text: { content: data.contact_id } }] }
      : undefined,

    utm_content: data.utm_content
      ? { rich_text: [{ text: { content: data.utm_content } }] }
      : undefined,

    utm_source: data.utm_source
      ? { rich_text: [{ text: { content: data.utm_source } }] }
      : undefined,

    fbclid: data.fbclid
      ? { rich_text: [{ text: { content: data.fbclid } }] }
      : undefined,

    utm_campaign: data.utm_campaign
      ? { rich_text: [{ text: { content: data.utm_campaign } }] }
      : undefined,

    utm_medium: data.utm_medium
      ? { rich_text: [{ text: { content: data.utm_medium } }] }
      : undefined,

    Temperatura: data.Temperatura
      ? { select: { name: data.Temperatura } }
      : undefined,

    utm_term: data.utm_term
      ? { rich_text: [{ text: { content: data.utm_term } }] }
      : undefined,

    Mail: data.email && data.email.trim() !== ''
      ? { email: data.email }
      : undefined,

    Embudo_1: data.Embudo_1
      ? { select: { name: data.Embudo_1 } }
      : undefined,

    Estrategia: Array.isArray(data.Estrategia)
      ? { multi_select: data.Estrategia.map(item => ({ name: item })) }
      : undefined,

    Mensualidad: Array.isArray(data.Mensualidad)
      ? { multi_select: data.Mensualidad.map(item => ({ name: item })) }
      : undefined,

    Recursos: Array.isArray(data.Recursos)
      ? { multi_select: data.Recursos.map(item => ({ name: item })) }
      : undefined,

    Productos_adquiridos: Array.isArray(data.Productos_adquiridos)
      ? { multi_select: data.Productos_adquiridos.map(item => ({ name: item })) }
      : undefined,

    Sub_productos: Array.isArray(data.Sub_productos)
      ? { multi_select: data.Sub_productos.map(item => ({ name: item })) }
      : undefined,

    Ultimo_contacto: data.Ultimo_contacto
      ? { date: { start: data.Ultimo_contacto } }
      : undefined,

    // ✅ Campo nuevo para Mongo ID
    mongo_id: data._id
      ? { rich_text: [{ text: { content: String(data._id) } }] }
      : undefined
  };
}


exports.createNotionContact = async (data) => {
  const properties = mapDataToNotionProperties(data);
  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties
  });
  console.log('✅ Creado en Notion:', response.id);
  return response.id;
};

exports.updateNotionContact = async (pageId, data) => {
  const properties = mapDataToNotionProperties(data);
  await notion.pages.update({
    page_id: pageId,
    properties
  });
  console.log('♻️ Actualizado en Notion:', pageId);
};

exports.findNotionContactByGhlId = async (ghlId) => {
  if (!ghlId) return null;
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'ghl_id',
      rich_text: {
        equals: ghlId
      }
    }
  });
  if (response.results && response.results.length > 0) {
    return response.results[0].id;
  }
  return null;
};
