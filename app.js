const form = document.getElementById("applicationForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

function showMessage(text, kind) {
  message.textContent = text;
  message.className = "message " + kind;
  message.scrollIntoView({behavior: "smooth", block: "center"});
}
function clean(value) {
  return String(value || "").trim();
}
function configured() {
  return window.CLUB_CONFIG &&
    window.CLUB_CONFIG.SUPABASE_URL.startsWith("https://") &&
    !window.CLUB_CONFIG.SUPABASE_URL.includes("NEXT_PUBLIC_SUPABASE_URL=https://lpfwxmwwbzfiyexmgzfv.supabase.co") &&
    window.CLUB_CONFIG.SUPABASE_ANON_KEY &&
    !window.CLUB_CONFIG.SUPABASE_ANON_KEY.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_lursLs-U5_5PI0n30ILfiQ_v_et-RmM");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.className = "message";
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  // Simple honeypot. It reduces basic bot submissions but is not a full anti-spam solution.
  if (clean(data.get("website"))) {
    showMessage("La demande n'a pas pu être traitée.", "error");
    return;
  }
  if (!configured() || !window.supabase) {
    showMessage("Configuration manquante : complète d'abord config.js avec l'URL et la clé publique de ton projet Supabase. Aucune donnée n'a été envoyée.", "error");
    return;
  }

  const payload = {
    last_name: clean(data.get("last_name")),
    first_name: clean(data.get("first_name")),
    program: clean(data.get("program")),
    level: clean(data.get("level")),
    email: clean(data.get("email")).toLowerCase(),
    whatsapp: clean(data.get("whatsapp")) || null,
    motivation: clean(data.get("motivation")),
    goals: clean(data.get("goals")),
    experience: clean(data.get("experience")),
    hours: clean(data.get("hours")),
    availability: clean(data.get("availability")),
    teamwork: clean(data.get("teamwork")),
    rules_accepted: data.get("rules") === "on",
    privacy_accepted: data.get("privacy") === "on"
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours…";
  try {
    const client = window.supabase.createClient(
      window.CLUB_CONFIG.SUPABASE_URL,
      window.CLUB_CONFIG.SUPABASE_ANON_KEY
    );
    const { error } = await client.from("club_applications").insert([payload]);
    if (error) {
      console.error("Erreur de dépôt", error);
      if (error.code === "23505") {
        showMessage("Une candidature avec cet e-mail existe déjà. Contacte le bureau si tu penses qu'il s'agit d'une erreur.", "error");
      } else {
        showMessage("L'envoi a échoué. Vérifie ta connexion ou contacte le bureau du club. Aucun message de succès n'a été affiché.", "error");
      }
      return;
    }
    form.reset();
    showMessage("Candidature envoyée avec succès ! Le bureau du club pourra l'examiner. Garde l'adresse e-mail que tu as fournie pour être joignable.", "success");
  } catch (err) {
    console.error(err);
    showMessage("Impossible de joindre le service pour le moment. Réessaie plus tard.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Envoyer ma candidature <span>→</span>';
  }
});