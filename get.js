const axios = require('axios');

// Usa tu API Key directamente o desde variable de entorno
const GHL_API_KEY = process.env.GOHIGHLEVEL_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IlAwd0JxNHJKcXh6b01HaEM3Yk9XIiwidmVyc2lvbiI6MSwiaWF0IjoxNzQ5MjQwNjM5MjUwLCJzdWIiOiI0MXhLc1lRSm9IMnVxT0oxNERTViJ9.ZQeFdga4BdxybDOW5tb7niGUA3OmtJ5Vg5Z-hsEOFdg';

const BASE_URL = 'https://rest.gohighlevel.com'; // Cambia si tu baseUrl es diferente

// Endpoint de contactos de GoHighLevel
const GHL_API_URL = `${BASE_URL}/v1/contacts`;
const CUSTOM_FIELDS_URL = `${BASE_URL}/v1/custom-fields/`;

async function getGhlContacts() {
  try {
    const response = await axios.get(GHL_API_URL, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const contactos = response.data.contacts || response.data; // Ajusta según respuesta real
    console.log(`Total contactos: ${contactos.length}`);
    console.log(contactos.slice(0, 5)); // Muestra los primeros 5
    // Para ver todos: console.log(contactos);
  } catch (error) {
    console.error('Error al obtener contactos de GHL:', error.response?.data || error.message);
  }
}

async function getCustomFields() {
  try {
    const response = await axios.get(CUSTOM_FIELDS_URL, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const fields = response.data.customFields || response.data;
    // Muestra los custom fields con nombre e id
    fields.forEach(field => {
      console.log(`Nombre: ${field.name} | ID: ${field.id}`);
    });
    // Si quieres ver el objeto completo:
    // console.log(fields);
  } catch (error) {
    console.error('Error al obtener custom fields:', error.response?.data || error.message);
  }
}

// Mapea los IDs de custom fields a nombres legibles (puedes actualizar esto con los nombres reales)
const customFieldMap = {
  "LqNrc2iiYFgZB8UdW3L6": "embudo",
  "NWI5HRjOu8aa8dD76kPS": "mensualidad",
  "8iPPm28N2l5HV94UeK28": "estrategia",
  "5OLqEbZYm5j95nLs0pcu": "productos",
  "9OG7VeaubWZFTIQmZsWa": "subProductos",
  "gc4F2H6uV9OezwglO6Uo": "recursos",
  "vy2rHZreNVdHWjxALxic": "temperatura",
  "cdJJCRzElVtnneHPPDhv": "utm_term",
  "pZ2bIKcQKS8AdpVQS1jc": "utm_medium",
  "LsczcupSHc2kT623s860": "utm_campaign",
  "9NcibYaWSp5ciwevtuAw": "fbclid",
  "hXPfmoL0QAeqYbSiNwNZ": "utm_source",
  "gq73k4n4NPhXuWuXfOqU": "utm_content"
};

// Obtiene el nombre del custom field por id desde la API de GHL
async function getCustomFieldNames() {
  const response = await axios.get(`${BASE_URL}/v1/custom-fields/`, {
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  // Devuelve un mapa { id: name }
  const map = {};
  (response.data.customFields || response.data).forEach(f => {
    map[f.id] = f.name;
  });
  return map;
}

// Muestra los custom fields de un contacto con nombre y valor
function printCustomFields(customFieldArr, fieldNameMap) {
  if (!Array.isArray(customFieldArr)) return;
  customFieldArr.forEach(field => {
    const name = fieldNameMap[field.id] || field.id;
    console.log(`${name}: ${field.value}`);
  });
}

async function main() {
  try {
    // Ejemplo: obtén un contacto (ajusta el endpoint según tu necesidad)
    const contactId = 'FBEk1RgBGpXsLXg8z06k'; // Usa el id que quieras consultar
    const contactRes = await axios.get(`${BASE_URL}/v1/contacts/${contactId}`, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const contact = contactRes.data.contact || contactRes.data;
    console.log('Contacto:', {
      id: contact.id,
      name: contact.contactName,
      phone: contact.phone,
      email: contact.email
    });

    // Obtén el mapa de nombres de custom fields
    const fieldNameMap = await getCustomFieldNames();

    // Muestra los custom fields con nombre y valor
    console.log('Custom fields:');
    printCustomFields(contact.customField, fieldNameMap);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

getGhlContacts();
getCustomFields();
main();