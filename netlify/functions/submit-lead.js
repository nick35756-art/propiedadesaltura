// netlify/functions/submit-lead.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  const data = event.body ? JSON.parse(event.body) : {};
  const photoUrls = [];
  if (data.files?.photos) {
    data.files.photos.forEach(file => file.url && photoUrls.push(file.url));
  }

  const lead = {
    name: data.name || "Sin nombre",
    phone: data.phone || "",
    email: data._replyto || data.email || "",
    city: data.city || "",
    lat: data.latitude || "",
    lng: data.longitude || "",
    type: data.property_type || "",
    area: data.area_m2 ? parseInt(data.area_m2) : null,
    message: data.message || "",
    photos: photoUrls,
    date: new Date().toISOString().split("T")[0]
  };

  const mapsLink = lead.lat && lead.lng 
    ? `https://www.google.com/maps?q=${lead.lat},${lead.lng}&z=18`
    : "";
  const embedLink = lead.lat && lead.lng 
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyCoIGK7pUUxiu0nJSJ79ckIcayGm5O31Zo&q=${lead.lat},${lead.lng}`
    : "";

  const filename = `properties/${lead.name.toLowerCase().replace(/\s+/g, '-')}-${lead.date}.yml`;

  const yaml = `---
layout: property
title: "${lead.name} - ${lead.city || 'Oriente Antioqueño'}"
price: "Por valorar"
bedrooms: ""
bathrooms: ""
area: ${lead.area || 'null'}
lot: null
photos:
${lead.photos.length > 0 ? lead.photos.map(url => `  - "${url}"`).join('\n') : '  []'}
location:
  lat: ${lead.lat}
  lng: ${lead.lng}
  maps_link: "${mapsLink}"
  embed_link: "${embedLink}"
contact:
  name: "${lead.name}"
  phone: "${lead.phone}"
  email: "${lead.email}"
  message: "${lead.message.replace(/"/g, '\\"')}"
date: "${lead.date}"
---
¡Nueva propiedad recibida!  
Tipo: ${lead.type}  
Ciudad: ${lead.city}  
${mapsLink ? `Ver en Google Maps: ${mapsLink}` : ''}
`;

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: "nick3576-art",
      repo: "propiedadesaltura",
      path: filename,
      message: `New lead: ${lead.name} (${lead.date})`,
      content: Buffer.from(yaml).toString("base64"),
      branch: "main"
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("GitHub error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
