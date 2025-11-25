// netlify/functions/submit-lead.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Extract photo URLs (Netlify uploads)
  const photoUrls = [];
  if (data.files?.photos) {
    data.files.photos.forEach(file => {
      if (file.url) photoUrls.push(file.url);
    });
  }

  const lead = {
    name: (data.name || "Sin nombre").trim(),
    phone: data.phone || "",
    email: data._replyto || data.email || "",
    city: data.city || "",
    lat: data.latitude || "",
    lng: data.longitude || "",
    type: data.property_type || "",
    area: data.area_m2 ? parseInt(data.area_m2, 10) : null,
    lot: data.lot_size ? parseInt(data.lot_size, 10) : null,
    price: data.asking_price ? parseInt(data.asking_price, 10) : null,
    message: data.message || "",
    photos: photoUrls,
    date: new Date().toISOString().split("T")[0]
  };

  // Generate map links
  const mapsLink = lead.lat && lead.lng
    ? `https://www.google.com/maps?q=${lead.lat},${lead.lng}&z=18`
    : "";
  const embedLink = lead.lat && lead.lng
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyCoIGK7pUUxiu0nJSJ79ckIcayGm5O31Zo&q=${lead.lat},${lead.lng}`
    : "";

  // Filename (safe for GitHub)
  const safeName = lead.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const filename = `properties/${safeName}-${lead.date}.yml`;

  // YAML frontmatter + body
  const yaml = `---
layout: property
title: "${lead.name} - ${lead.city || "Oriente Antioqueño"}"
price: "${lead.price ? lead.price.toLocaleString() + " COP" : "Por valorar"}"
bedrooms: ""
bathrooms: ""
area: ${lead.area || "null"}
lot: ${lead.lot || "null"}
photos:${lead.photos.length > 0 ? "\n  - " + lead.photos.join("\n  - ") : " []"}
location:
  lat: ${lead.lat || "null"}
  lng: ${lead.lng || "null"}
  maps_link: "${mapsLink}"
  embed_link: "${embedLink}"
contact:
  name: "${lead.name}"
  phone: "${lead.phone}"
  email: "${lead.email}"
  message: "${lead.message.replace(/"/g, '\\"')}"
date: "${lead.date}"
---
¡Nueva propiedad recibida automáticamente!
Tipo: ${lead.type}
Ciudad: ${lead.city}
${lead.price ? "Precio esperado: $" + lead.price.toLocaleString() + " COP" : ""}
${lead.lot ? "Lote: " + lead.lot + " m²" : ""}
${mapsLink ? "Ver en Google Maps: " + mapsLink : ""}
`;

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: "nick3576-art",
      repo: "propiedadesaltura",
      path: filename,
      message: `Nueva propiedad: ${lead.name} (${lead.date})`,
      content: Buffer.from(yaml).toString("base64"),
      branch: "main"
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Propiedad publicada!" })
    };
  } catch (error) {
    console.error("GitHub API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
