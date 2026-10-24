let client;
let allApplications = [];
const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const adminMessage = document.getElementById("adminMessage");
const list = document.getElementById("applications");
const statusLabels = {new:"Nouvelle", reviewing:"À examiner", accepted:"Retenue", rejected:"Non retenue"};

function msg(text, kind="error") { adminMessage.textContent=text; adminMessage.className="message "+kind; }
function setupClient() {
  if (!window.CLUB_CONFIG || !window.CLUB_CONFIG.SUPABASE_URL.startsWith("https://") ||
      window.CLUB_CONFIG.SUPABASE_URL.includes("NEXT_PUBLIC_SUPABASE_URL=https://lpfwxmwwbzfiyexmgzfv.supabase.co")||
      window.CLUB_CONFIG.SUPABASE_ANON_KEY.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_lursLs-U5_5PI0n30ILfiQ_v_et-RmM")) return false;
  client = window.supabase.createClient(window.CLUB_CONFIG.SUPABASE_URL, window.CLUB_CONFIG.SUPABASE_ANON_KEY);
  return true;
}
function safe(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function render() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const rows = allApplications.filter(a => {
    const text = [a.last_name,a.first_name,a.program,a.email].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (!status || a.status === status);
  });
  document.getElementById("count").textContent = `${rows.length} candidature(s) affichée(s) · ${allApplications.length} au total`;
  if (!rows.length) { list.innerHTML = '<p class="empty">Aucune candidature à afficher.</p>'; return; }
  list.innerHTML = rows.map(a => `
    <article class="application">
      <div class="application-head"><div><h3>${safe(a.first_name)} ${safe(a.last_name)}</h3><p>${safe(a.program)} · ${safe(a.level)}</p></div><span class="status status-${safe(a.status)}">${safe(statusLabels[a.status] || a.status)}</span></div>
      <div class="details"><p><b>E-mail :</b> ${safe(a.email)}</p><p><b>WhatsApp :</b> ${safe(a.whatsapp || "Non renseigné")}</p><p><b>Expérience :</b> ${safe(a.experience)}</p><p><b>Disponibilité :</b> ${safe(a.hours)} / semaine · ${safe(a.availability)}</p><p><b>Travail en équipe :</b> ${safe(a.teamwork)}</p><p><b>Motivation :</b><br>${safe(a.motivation)}</p><p><b>Objectifs :</b><br>${safe(a.goals)}</p><p class="date">Reçue le ${new Date(a.created_at).toLocaleString("fr-FR")}</p></div>
      <label class="status-control">Statut de la candidature<select data-id="${safe(a.id)}" class="statusSelect">${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${a.status===v?"selected":""}>${l}</option>`).join("")}</select></label>
    </article>`).join("");
  list.querySelectorAll(".statusSelect").forEach(el => el.addEventListener("change", async e => {
    const id = e.target.dataset.id, newStatus = e.target.value;
    e.target.disabled = true;
    const {error} = await client.from("club_applications").update({status:newStatus}).eq("id",id);
    e.target.disabled = false;
    if (error) { alert("Modification impossible. Vérifie les règles RLS et les droits administrateur."); await loadApplications(); return; }
    const item = allApplications.find(x => x.id === id); if (item) item.status = newStatus;
    render();
  }));
}
async function loadApplications() {
  list.innerHTML = "<p>Chargement des candidatures…</p>";
  const {data,error} = await client.from("club_applications").select("*").order("created_at",{ascending:false});
  if (error) { list.innerHTML = '<p class="empty">Accès refusé ou erreur de chargement. Vérifie que ton compte est inscrit dans la table club_admins.</p>'; return; }
  allApplications = data || []; render();
}
document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault(); if (!client) { msg("Complète d'abord config.js avec la configuration Supabase."); return; }
  const fd = new FormData(e.target);
  const {error} = await client.auth.signInWithPassword({email:fd.get("email"),password:fd.get("password")});
  if (error) { msg("Connexion refusée. Vérifie l'e-mail, le mot de passe et que le compte existe dans Supabase Auth."); return; }
  loginCard.classList.add("hidden"); dashboard.classList.remove("hidden"); adminMessage.textContent=""; await loadApplications();
});
document.getElementById("logoutBtn").addEventListener("click", async()=>{await client.auth.signOut(); dashboard.classList.add("hidden");loginCard.classList.remove("hidden");});
document.getElementById("search").addEventListener("input",render);
document.getElementById("statusFilter").addEventListener("change",render);
if (!setupClient()) msg("Configuration Supabase manquante : renseigne config.js.");
else client.auth.getSession().then(async ({data}) => { if (data.session) {loginCard.classList.add("hidden");dashboard.classList.remove("hidden");await loadApplications();} });