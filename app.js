// app.js – language + lightbox + map + clusters
document.addEventListener("DOMContentLoaded", function () {
  // Language switcher
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      document.documentElement.lang = lang;
      document.querySelectorAll("[data-es],[data-en]").forEach(el => {
        el.textContent = lang === "es" ? el.dataset.es : el.dataset.en;
      });
      document.querySelectorAll("input").forEach(input => {
        input.placeholder = lang === "es" ? input.dataset.esPlaceholder : input.dataset.enPlaceholder;
      });
      document.querySelectorAll(".lang-btn").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    });
  });

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Lightbox
  const lightbox = document.getElementById("lightbox");
  const lbImage = document.getElementById("lb-image");
  const lbCounter = document.getElementById("lb-counter");
  let photos = [], idx = 0;
  document.querySelectorAll("[data-action='open-gallery']").forEach(btn => {
    btn.addEventListener("click", () => {
      photos = JSON.parse(btn.closest(".property-card").dataset.photos);
      idx = 0;
      lbImage.src = photos[0];
      lbCounter.textContent = `1 / ${photos.length}`;
      lightbox.style.display = "flex";
    });
  });
  document.getElementById("lb-close").addEventListener("click", () => lightbox.style.display = "none");
  document.getElementById("lb-prev").addEventListener("click", () => { idx = (idx - 1 + photos.length) % photos.length; lbImage.src = photos[idx]; lbCounter.textContent = `${idx+1}/${photos.length}`; });
  document.getElementById("lb-next").addEventListener("click", () => { idx = (idx + 1) % photos.length; lbImage.src = photos[idx]; lbCounter.textContent = `${idx+1}/${photos.length}`; });
  lightbox.addEventListener("click", e => e.target === lightbox && (lightbox.style.display = "none"));

  // MAP WITH CLUSTERS
  window.initMap = function () {
    const map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 6.2442, lng: -75.5812 },
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    const markers = [];
    const bounds = new google.maps.LatLngBounds();
    document.querySelectorAll(".property-card").forEach(card => {
      const lat = parseFloat(card.dataset.lat);
      const lng = parseFloat(card.dataset.lng);
      if (isNaN(lat) || isNaN(lng)) return;
      const marker = new google.maps.Marker({
        position: { lat, lng },
        title: card.querySelector(".property-title").textContent.trim()
      });
      marker.addListener("click", () => {
        map.setZoom(16);
        map.panTo(marker.position);
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        document.querySelectorAll(".property-card").forEach(c => c.classList.remove("highlight"));
        card.classList.add("highlight");
      });
      card.addEventListener("click", () => google.maps.event.trigger(marker, "click"));
      markers.push(marker);
      bounds.extend({ lat, lng });
    });
    new MarkerClusterer({ markers, map });
    if (!bounds.isEmpty()) map.fitBounds(bounds, 80);
    const input = document.getElementById("search-input");
    if (input) {
      const searchBox = new google.maps.places.SearchBox(input);
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places.length) return;
        const place = places[0];
        if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
        else if (place.geometry.location) { map.setCenter(place.geometry.location); map.setZoom(14); }
      });
    }
    map.addListener("idle", () => {
      const bounds = map.getBounds();
      if (!bounds) return;
      document.querySelectorAll(".property-card").forEach(card => {
        const lat = parseFloat(card.dataset.lat);
        const lng = parseFloat(card.dataset.lng);
        if (isNaN(lat) || isNaN(lng)) return card.classList.remove("hidden");
        const pos = new google.maps.LatLng(lat, lng);
        card.classList.toggle("hidden", !bounds.contains(pos));
      });
    });
  };
});
