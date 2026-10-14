/* Erbil SchoolTracks - app logic
 * Demo mode uses localStorage. Configure Supabase in js/config.js and run
 * supabase/schema.sql to use the online database.
 */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const demoKey = "erbil-schooltracks-demo-v1";
  const seed = {
    students: [
      {id:"s1",name:"هانا عەلی",school:"قوتابخانەی ڕووناکی",phone:"0750 111 2233",grade:"پۆلی ٦",address:"گەڕەکی ئیسکان",lat:36.1908,lng:44.0092,created_at:new Date().toISOString()},
      {id:"s2",name:"ئاراس محەمەد",school:"قوتابخانەی هەولێر",phone:"0750 222 3344",grade:"پۆلی ٤",address:"گەڕەکی شۆڕش",lat:36.2041,lng:44.0184,created_at:new Date().toISOString()},
      {id:"s3",name:"دانا کەریم",school:"قوتابخانەی ڕووناکی",phone:"0750 333 4455",grade:"پۆلی ٥",address:"گەڕەکی زانیاری",lat:null,lng:null,created_at:new Date().toISOString()}
    ],
    drivers: [
      {id:"d1",name:"سەردار عومەر",phone:"0750 444 5566",vehicle_type:"پاس",notes:"بەردەست"},
      {id:"d2",name:"ڕێباز حەمە",phone:"0750 555 6677",vehicle_type:"تەکسی",notes:""},
    ],
    vehicles: [
      {id:"v1",number:"پاس-٠١",type:"پاس",capacity:24,driver_id:"d1"},
      {id:"v2",number:"تەکسی-٠١",type:"تەکسی",capacity:4,driver_id:"d2"}
    ]
  };
  let state = loadDemo();
  let supabaseClient = null;
  let online = false;
  let toastTimer;
  function loadDemo(){try{return JSON.parse(localStorage.getItem(demoKey))||structuredClone(seed)}catch{return JSON.parse(JSON.stringify(seed))}}
  function saveDemo(){localStorage.setItem(demoKey,JSON.stringify(state))}
  function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),3200)}
  function makeId(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)}
  function hasSupabaseConfig(){const c=window.APP_CONFIG||{};return !!(c.SUPABASE_URL&&c.SUPABASE_ANON_KEY&&window.supabase)}
  async function initBackend(){
    if(!hasSupabaseConfig()){setConnection(false);renderAll();return}
    try{
      supabaseClient=window.supabase.createClient(window.APP_CONFIG.SUPABASE_URL,window.APP_CONFIG.SUPABASE_ANON_KEY);
      // Reads work only after SQL schema and RLS policies have been applied.
      const [s,d,v]=await Promise.all([
        supabaseClient.from("students").select("*").order("created_at",{ascending:false}),
        supabaseClient.from("drivers").select("*").order("created_at",{ascending:false}),
        supabaseClient.from("vehicles").select("*").order("created_at",{ascending:false})
      ]);
      const error=[s.error,d.error,v.error].find(Boolean);
      if(error) throw error;
      state={students:s.data||[],drivers:d.data||[],vehicles:v.data||[]};online=true;setConnection(true);renderAll();
    }catch(err){console.error("Supabase setup/read error:",err);setConnection(false);renderAll();toast("پەیوەندی بە داتابەیس سەرکەوتوو نەبوو؛ داتای ناوخۆیی پیشان دەدرێت. ڕێکخستنەکان بپشکنە.")}
  }
  function setConnection(isOnline){online=isOnline;$("connectionState").innerHTML=isOnline?'<i></i> داتابەیسی ئۆنلاین':'<i></i> داتای ناوخۆیی';$("connectionState").classList.toggle("online",isOnline);$("connectionState").querySelector("i").style.background=isOnline?"#20b47b":"#e8a23b"}
  async function saveRecord(table,record,isUpdate=false){
    if(online&&supabaseClient){
      const {error}=isUpdate?await supabaseClient.from(table).update(record).eq("id",record.id):await supabaseClient.from(table).insert(record);
      if(error)throw error;
      const listKey=table;
      if(isUpdate){state[listKey]=state[listKey].map(x=>x.id===record.id?{...x,...record}:x)}else state[listKey].unshift(record);
    }else{
      const listKey=table;
      const idx=state[listKey].findIndex(x=>x.id===record.id);
      if(idx>=0)state[listKey][idx]={...state[listKey][idx],...record};else state[listKey].unshift(record);
      saveDemo();
    }
    renderAll();
  }
  async function deleteRecord(table,id){
    if(!confirm("دڵنیایت دەتەوێت ئەم تۆمارە بسڕیتەوە؟"))return;
    try{
      if(online&&supabaseClient){const {error}=await supabaseClient.from(table).delete().eq("id",id);if(error)throw error}
      state[table]=state[table].filter(x=>x.id!==id);if(!online)saveDemo();renderAll();toast("تۆمارەکە سڕایەوە.");
    }catch(e){console.error(e);toast("سڕینەوە سەرکەوتوو نەبوو؛ دەسەڵات و داتابەیس بپشکنە.")}
  }
  function initials(name){return (name||"?").trim().slice(0,1)}
  function renderDashboard(){
    $("statStudents").textContent=state.students.length;$("statDrivers").textContent=state.drivers.length;$("statVehicles").textContent=state.vehicles.length;
    $("statLocations").textContent=state.students.filter(s=>s.lat!=null&&s.lng!=null).length;
    const recent=state.students.slice(0,5);
    $("recentStudents").innerHTML=recent.length?recent.map(s=>`<div class="recent-item"><div class="student-avatar">${esc(initials(s.name))}</div><div class="recent-info"><strong>${esc(s.name)}</strong><small>${esc(s.school||"قوتابخانە دیاری نەکراوە")}</small></div><span class="mini-status">${s.lat!=null&&s.lng!=null?"شوێن هەیە":"شوێن نییە"}</span></div>`).join(""):'<div class="empty-state">هێشتا قوتابی تۆمار نەکراوە.</div>';
  }
  function renderStudents(){
    const q=($("studentSearch").value||"").trim().toLocaleLowerCase();
    const rows=state.students.filter(s=>[s.name,s.school,s.phone,s.address].some(v=>String(v||"").toLocaleLowerCase().includes(q)));
    $("studentCount").textContent=`${rows.length} قوتابی`;
    $("studentsTable").innerHTML=rows.map(s=>`<tr><td><div class="person-cell"><div class="student-avatar">${esc(initials(s.name))}</div><div><strong>${esc(s.name)}</strong><small>${esc(s.grade||"پۆل دیاری نەکراوە")}</small></div></div></td><td>${esc(s.school||"—")}</td><td>${esc(s.phone||"—")}</td><td>${s.lat!=null&&s.lng!=null?'<span class="mini-status">دیاریکراوە</span>':'<span>دیاری نەکراوە</span>'}</td><td><button class="table-action" data-location="${esc(s.id)}">شوێن</button><button class="table-action danger" data-delete-student="${esc(s.id)}">سڕینەوە</button></td></tr>`).join("");
    $("studentsEmpty").classList.toggle("hidden",rows.length!==0);
  }
  function renderDrivers(){
    const q=($("driverSearch").value||"").trim().toLocaleLowerCase();const rows=state.drivers.filter(d=>[d.name,d.phone,d.vehicle_type,d.notes].some(v=>String(v||"").toLocaleLowerCase().includes(q)));
    $("driverCount").textContent=`${rows.length} شۆفێر`;
    $("driversTable").innerHTML=rows.map(d=>`<tr><td><div class="person-cell"><div class="student-avatar">${esc(initials(d.name))}</div><div><strong>${esc(d.name)}</strong></div></div></td><td>${esc(d.phone||"—")}</td><td>${esc(d.vehicle_type||"—")}</td><td>${esc(d.notes||"—")}</td><td><button class="table-action" data-edit-driver="${esc(d.id)}">دەستکاری</button><button class="table-action danger" data-delete-driver="${esc(d.id)}">سڕینەوە</button></td></tr>`).join("");
    $("driversEmpty").classList.toggle("hidden",rows.length!==0);
  }
  function renderVehicles(){
    const q=($("vehicleSearch").value||"").trim().toLocaleLowerCase();const rows=state.vehicles.filter(v=>[v.number,v.type].some(x=>String(x||"").toLocaleLowerCase().includes(q)));
    $("vehicleCount").textContent=`${rows.length} ئۆتۆمبێل`;
    $("vehiclesTable").innerHTML=rows.map(v=>{const d=state.drivers.find(x=>x.id===v.driver_id);return `<tr><td><strong>${esc(v.number)}</strong></td><td>${esc(v.type)}</td><td>${esc(v.capacity)} کەس</td><td>${esc(d?.name||"دیاری نەکراوە")}</td><td><button class="table-action" data-edit-vehicle="${esc(v.id)}">دەستکاری</button><button class="table-action danger" data-delete-vehicle="${esc(v.id)}">سڕینەوە</button></td></tr>`}).join("");
    $("vehiclesEmpty").classList.toggle("hidden",rows.length!==0);
  }
  function renderSelects(){
    const studentSelect=$("locationStudent"),old=studentSelect.value;
    studentSelect.innerHTML='<option value="">قوتابی هەڵبژێرە</option>'+state.students.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("");
    if(state.students.some(s=>s.id===old))studentSelect.value=old;
    const driverSelect=$("vehicleDriver"),oldDriver=driverSelect.value;
    driverSelect.innerHTML='<option value="">دیاری نەکراوە</option>'+state.drivers.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join("");
    if(state.drivers.some(d=>d.id===oldDriver))driverSelect.value=oldDriver;
  }
  function renderAll(){renderDashboard();renderStudents();renderDrivers();renderVehicles();renderSelects();if(window.SchoolMap)window.SchoolMap.refresh()}
  function navigate(view){
    document.querySelectorAll(".view").forEach(el=>el.classList.toggle("active",el.id===`view-${view}`));
    document.querySelectorAll(".nav-link").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
    const labels={dashboard:"داشبۆرد",students:"قوتابیان",drivers:"شۆفێران",vehicles:"پاس و تەکسی",map:"نەخشە و شوێن"};
    $("pageTitle").textContent=labels[view]||"داشبۆرد";$("sidebar").classList.remove("open");
    if(view==="map"&&window.SchoolMap)window.SchoolMap.invalidate();
    if(view==="dashboard"&&window.SchoolMap)window.SchoolMap.invalidateDashboard();
  }
  function openStudent(id=null){
    const s=state.students.find(x=>x.id===id);$("studentForm").reset();$("studentId").value=s?.id||"";
    $("studentName").value=s?.name||"";$("schoolName").value=s?.school||"";$("parentPhone").value=s?.phone||"";$("studentGrade").value=s?.grade||"";$("studentAddress").value=s?.address||"";$("studentLat").value=s?.lat??"";$("studentLng").value=s?.lng??"";
    $("studentDialog").querySelector("h2").textContent=s?"دەستکاریکردنی زانیاریی قوتابی":"زیادکردنی قوتابی";$("studentDialog").showModal();
  }
  function openDriver(id=null){
    const d=state.drivers.find(x=>x.id===id);$("driverForm").reset();$("driverId").value=d?.id||"";$("driverName").value=d?.name||"";$("driverPhone").value=d?.phone||"";$("driverVehicleType").value=d?.vehicle_type||"پاس";$("driverNotes").value=d?.notes||"";$("driverDialog").querySelector("h2").textContent=d?"دەستکاریکردنی شۆفێر":"زیادکردنی شۆفێر";$("driverDialog").showModal();
  }
  function openVehicle(id=null){
    const v=state.vehicles.find(x=>x.id===id);$("vehicleForm").reset();renderSelects();$("vehicleId").value=v?.id||"";$("vehicleNumber").value=v?.number||"";$("vehicleType").value=v?.type||"پاس";$("vehicleCapacity").value=v?.capacity||14;$("vehicleDriver").value=v?.driver_id||"";$("vehicleDialog").querySelector("h2").textContent=v?"دەستکاریکردنی ئۆتۆمبێل":"زیادکردنی ئۆتۆمبێل";$("vehicleDialog").showModal();
  }
  function gotoStudentLocation(id){navigate("map");$("locationStudent").value=id;const s=state.students.find(x=>x.id===id);if(s&&s.lat!=null&&s.lng!=null&&window.SchoolMap)window.SchoolMap.focus(s.lat,s.lng);else toast("ئەم قوتابییە شوێنی پاشەکەوتکراوی نییە؛ لە نەخشە کلیک بکە.")}
  document.addEventListener("click",async e=>{
    const nav=e.target.closest("[data-view]");if(nav)navigate(nav.dataset.view);
    const go=e.target.closest("[data-goto]");if(go)navigate(go.dataset.goto);
    const close=e.target.closest("[data-close]");if(close)$(close.dataset.close).close();
    const loc=e.target.closest("[data-location]");if(loc)gotoStudentLocation(loc.dataset.location);
    const delS=e.target.closest("[data-delete-student]");if(delS)await deleteRecord("students",delS.dataset.deleteStudent);
    const delD=e.target.closest("[data-delete-driver]");if(delD)await deleteRecord("drivers",delD.dataset.deleteDriver);
    const delV=e.target.closest("[data-delete-vehicle]");if(delV)await deleteRecord("vehicles",delV.dataset.deleteVehicle);
    const editD=e.target.closest("[data-edit-driver]");if(editD)openDriver(editD.dataset.editDriver);
    const editV=e.target.closest("[data-edit-vehicle]");if(editV)openVehicle(editV.dataset.editVehicle);
  });
  $("quickAddStudent").addEventListener("click",()=>openStudent());$("addStudentBtn").addEventListener("click",()=>openStudent());$("addDriverBtn").addEventListener("click",()=>openDriver());$("addVehicleBtn").addEventListener("click",()=>openVehicle());
  $("studentSearch").addEventListener("input",renderStudents);$("driverSearch").addEventListener("input",renderDrivers);$("vehicleSearch").addEventListener("input",renderVehicles);
  $("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
  $("studentForm").addEventListener("submit",async e=>{
    e.preventDefault();const id=$("studentId").value||makeId();const lat=$("studentLat").value.trim(),lng=$("studentLng").value.trim();
    if((lat&&!lng)||(!lat&&lng)){toast("بۆ شوێن، هەردوو Latitude و Longitude پێویستن.");return}
    const record={id,name:$("studentName").value.trim(),school:$("schoolName").value.trim(),phone:$("parentPhone").value.trim(),grade:$("studentGrade").value.trim(),address:$("studentAddress").value.trim(),lat:lat?Number(lat):null,lng:lng?Number(lng):null,created_at:state.students.find(x=>x.id===id)?.created_at||new Date().toISOString()};
    try{await saveRecord("students",record,!!$("studentId").value);$("studentDialog").close();toast("زانیاریی قوتابی پاشەکەوت کرا.");}catch(err){console.error(err);toast("پاشەکەوتکردن سەرکەوتوو نەبوو. داتابەیس و دەسەڵاتەکان بپشکنە.")}
  });
  $("driverForm").addEventListener("submit",async e=>{
    e.preventDefault();const id=$("driverId").value||makeId();const record={id,name:$("driverName").value.trim(),phone:$("driverPhone").value.trim(),vehicle_type:$("driverVehicleType").value,notes:$("driverNotes").value.trim(),created_at:state.drivers.find(x=>x.id===id)?.created_at||new Date().toISOString()};
    try{await saveRecord("drivers",record,!!$("driverId").value);$("driverDialog").close();toast("زانیاریی شۆفێر پاشەکەوت کرا.");}catch(err){console.error(err);toast("پاشەکەوتکردن سەرکەوتوو نەبوو؛ ڕێکخستنەکان بپشکنە.")}
  });
  $("vehicleForm").addEventListener("submit",async e=>{
    e.preventDefault();const id=$("vehicleId").value||makeId();const record={id,number:$("vehicleNumber").value.trim(),type:$("vehicleType").value,capacity:Number($("vehicleCapacity").value),driver_id:$("vehicleDriver").value||null,created_at:state.vehicles.find(x=>x.id===id)?.created_at||new Date().toISOString()};
    try{await saveRecord("vehicles",record,!!$("vehicleId").value);$("vehicleDialog").close();toast("زانیاریی ئۆتۆمبێل پاشەکەوت کرا.");}catch(err){console.error(err);toast("پاشەکەوتکردن سەرکەوتوو نەبوو؛ ڕێکخستنەکان بپشکنە.")}
  });
  $("locationForm").addEventListener("submit",async e=>{
    e.preventDefault();const id=$("locationStudent").value;const lat=Number($("latitude").value),lng=Number($("longitude").value);
    if(!id){toast("تکایە قوتابییەک هەڵبژێرە.");return}
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat>90||lng < -180||lng>180){toast("ژمارەکانی Latitude و Longitude دروست نین.");return}
    const s=state.students.find(x=>x.id===id);if(!s)return;
    try{await saveRecord("students",{...s,lat,lng,address:$("address").value.trim()||s.address||""},true);if(window.SchoolMap)window.SchoolMap.refresh();toast("شوێنی قوتابی پاشەکەوت کرا.");}catch(err){console.error(err);toast("پاشەکەوتکردنی شوێن سەرکەوتوو نەبوو.")}
  });
  document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
  $("year").textContent=new Date().getFullYear();
  window.SchoolApp={getState:()=>state,toast,saveRecord,navigate,online:()=>online};
  initBackend();
})();
