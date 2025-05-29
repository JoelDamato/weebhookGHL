const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Map GHL data to Notion properties
function mapDataToNotionProperties(data) {
  return {
    Nombre: {
      title: [
        {
          text: {
            content: data.full_name || ''
          }
        }
      ]
    },
    Telefono: {
      rich_text: data.phone || ''
    },
    Estado: {
      select: [
        {
          text: {
            content: data.tags || ''
          }
        }
      ]
    },
    ghl_id: {
      rich_text: [
        {
          text: {
            content: data.contact_id || ''
          }
        }
      ]
    },
    utm_content: {
      rich_text: [
        {
          text: {
            content: data.utm_content || ''
          }
        }
      ]
    },
    utm_source: {
      rich_text: [
        {
          text: {
            content: data.utm_source || ''
          }
        }
      ]
    },
    fbclid: {
      rich_text: [
        {
          text: {
            content: data.fbclid || ''
          }
        }
      ]
    },
    utm_campaign: {
      rich_text: [
        {
          text: {
            content: data.utm_campaign || ''
          }
        }
      ]
    },
    Temperatura: {
      select: [
        {
          text: {
            content: data.Temperatura || ''
          }
        }
      ]
    },
    utm_term: {
      rich_text: [
        {
          text: {
            content: data.utm_term || ''
          }
        }
      ]
    },
    Mail: {
      email: data.email || ''
    }
  };
}

// Crear nuevo registro en Notion
exports.createNotionContact = async (data) => {
  const properties = mapDataToNotionProperties(data);
  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties
  });
  console.log('✅ Creado en Notion:', response.id);
  return response.id;
};

// Actualizar registro existente en Notion
exports.updateNotionContact = async (pageId, data) => {
  const properties = mapDataToNotionProperties(data);
  await notion.pages.update({
    page_id: pageId,
    properties
  });
  console.log('♻️ Actualizado en Notion:', pageId);
};
