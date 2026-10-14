/* Leaflet map module - Erbil city center */
(() => {
  "use strict";
  const ERBIL=[36.1911,44.0092];
  let dashboardMap=null,mainMap=null,dashboardLayer=null,mainLayer=null,selectedMarker=null;
  const $=id=>document.getElementById(id);
  const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function makeMap(elId,zoom=12){
    const map=L.map(elId,{scrollWheelZoom:false}).setView(ERBIL,zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
    return map;
  }
  function popup(s){return `<strong>${escapeHtml(s.name)}</strong><br>${escapeHtml(s.school||"قوتابخانە دیاری نەکراوە")}<br>${escapeHtml(s.address||"ناونیشان نییە")}`}
  function refresh(){
    if(!window.L||!window.SchoolApp)return;
    const state=window.SchoolApp.getState(), students=state.students.filter(s=>s.lat!=null&&s.lng!=null&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng)));
    if(dashboardMap){if(dashboardLayer)dashboardLayer.remove();dashboardLayer=L.layerGroup().addTo(dashboardMap);students.forEach(s=>L.marker([Number(s.lat),Number(s.lng)]).bindPopup(popup(s)).addTo(dashboardLayer))}
    if(mainMap){if(mainLayer)mainLayer.remove();mainLayer=L.layerGroup().addTo(mainMap);students.forEach(s=>L.marker([Number(s.lat),Number(s.lng)]).bindPopup(popup(s)).addTo(mainLayer))}
  }
  function init(){
    if(!window.L){console.warn("Leaflet failed to load");return}
    dashboardMap=makeMap("dashboardMap",12);dashboardLayer=L.layerGroup().addTo(dashboardMap);
    mainMap=makeMap("mainMap",12);mainLayer=L.layerGroup().addTo(mainMap);
    mainMap.on("click",e=>{if(selectedMarker)selectedMarker.remove();selectedMarker=L.marker(e.latlng).addTo(mainMap).bindPopup("شوێنی هەڵبژێردراو").openPopup();$("latitude").value=e.latlng.lat.toFixed(6);$("longitude").value=e.latlng.lng.toFixed(6)});
    $("locateMe").addEventListener("click",()=>{
      if(!navigator.geolocation){window.SchoolApp.toast("ئەم وێبگەڕە GPS پشتگیری ناکات.");return}
      navigator.geolocation.getCurrentPosition(pos=>{const lat=pos.coords.latitude,lng=pos.coords.longitude;mainMap.setView([lat,lng],16);if(selectedMarker)selectedMarker.remove();selectedMarker=L.marker([lat,lng]).addTo(mainMap).bindPopup("شوێنی ئێستای تۆ").openPopup();$("latitude").value=lat.toFixed(6);$("longitude").value=lng.toFixed(6)},()=>window.SchoolApp.toast("نەتوانرا شوێن بدۆزرێتەوە. مۆڵەتی Location و HTTPS بپشکنە."),{enableHighAccuracy:true,timeout:10000});
    });
    refresh();
  }
  window.SchoolMap={refresh,invalidate(){setTimeout(()=>mainMap&&mainMap.invalidateSize(),100)},invalidateDashboard(){setTimeout(()=>dashboardMap&&dashboardMap.invalidateSize(),100)},focus(lat,lng){if(mainMap){mainMap.setView([Number(lat),Number(lng)],16);L.popup().setLatLng([Number(lat),Number(lng)]).setContent("شوێنی قوتابی").openOn(mainMap)}},};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
