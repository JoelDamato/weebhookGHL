const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Map GHL data to Notion properties (actualizado para selects y phone)
function mapDataToNotionProperties(data) {
  return {
    Nombre: data.full_name
      ? { title: [{ text: { content: data.full_name } }] }
      : undefined,

    Telefono: data.phone
      ? { phone_number: data.phone }
      : undefined,

    Estado: data.tags
      ? { select: { name: data.tags } }
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
