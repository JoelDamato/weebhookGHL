// src/services/notionService.js
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Función para mapear los datos de GHL a propiedades de Notion
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
      phone_number: data.phone || ''
    },
    Estado: {
      rich_text: [
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
      rich_text: [
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

exports.crearEnNotion = async (data) => {
  const properties = mapDataToNotionProperties(data);
  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties
  });
  return response.id;
};

exports.actualizarEnNotion = async (pageId, data) => {
  const properties = mapDataToNotionProperties(data);
  await notion.pages.update({
    page_id: pageId,
    properties
  });
};
