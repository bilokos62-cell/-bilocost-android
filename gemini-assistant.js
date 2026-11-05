/* Bilocost Gemini assistant — injected into the shared web/PWA application. */
(function(){
  if (window.__bilocostGeminiAssistantInstalled) return;
  window.__bilocostGeminiAssistantInstalled = true;

  let geminiModel = null;
  let requestBusy = false;
  let lastRequestAt = 0;

  function initGemini(){
    try {
      if (typeof getAI !== "function" ||
          typeof GoogleAIBackend !== "function" ||
          typeof getGenerativeModel !== "function" ||
          typeof a === "undefined") {
        throw new Error("Firebase AI Logic non initialisé dans cette version.");
      }
      const firebaseAI = getAI(a, { backend: new GoogleAIBackend() });
      geminiModel = getGenerativeModel(firebaseAI, {
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0.35, maxOutputTokens: 700 }
      });
      return true;
    } catch (error) {
      console.error("Bilocost Gemini initialization:", error);
      return false;
    }
  }

  function cleanText(value, max){
    return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0,max);
  }

  async function askGemini(prompt, purpose){
    if (!geminiModel && !initGemini()) throw new Error("L’assistant IA est momentanément indisponible. Vérifiez la connexion Firebase.");
    const now = Date.now();
    if (requestBusy) throw new Error("Une réponse est déjà en cours. Patientez un instant.");
    if (now - lastRequestAt < 2500) throw new Error("Veuillez patienter quelques secondes avant une nouvelle demande.");
    requestBusy = true;
    lastRequestAt = now;
    try {
      const result = await geminiModel.generateContent(
        "Tu es l’assistant officiel de Bilocost, une marketplace congolaise. " +
        "Réponds en français clair et concis, ou dans la langue demandée. " +
        "Aide sur la publication, les annonces, les services, la location et l’utilisation de Bilocost. " +
        "N’invente jamais les prix, les statuts de paiement, les livraisons, les garanties ou les fonctions non confirmées. " +
        "Ne demande jamais de mot de passe, code OTP, numéro de carte ou secret. " +
        "Pour les paiements et litiges, conseille de passer uniquement par les canaux officiels de Bilocost. " +
        "Si tu ne connais pas une information propre au compte ou à une transaction, dis que tu ne peux pas y accéder.\n\n" +
        "Type de demande: " + cleanText(purpose,80) + "\n" +
        "Demande: " + cleanText(prompt,1800)
      );
      const answer = result && result.response ? result.response.text() : "";
      if (!answer || !String(answer).trim()) throw new Error("Gemini n’a pas retourné de réponse. Réessayez.");
      return String(answer).trim();
    } finally {
      requestBusy = false;
    }
  }

  // Public helper for the product-listing form or other Bilocost screens.
  window.bilocostGeminiImproveListing = async function(title, description, category){
    const input = {
      titre: cleanText(title,180),
      description: cleanText(description,1200),
      categorie: cleanText(category,100)
    };
    if (!input.titre && !input.description) throw new Error("Ajoutez un titre ou une description avant de demander l’amélioration.");
    const raw = await askGemini(
      "Améliore cette annonce sans inventer de caractéristiques. Conserve les informations exactes. " +
      "Retourne uniquement un objet JSON avec les clés titre et description.\n" +
      JSON.stringify(input),
      "Amélioration d’annonce"
    );
    const json = raw.replace(/^\u0060\u0060\u0060(?:json)?\s*/i,"").replace(/\s*\u0060\u0060\u0060$/,"");
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed.titre !== "string" || typeof parsed.description !== "string") {
      throw new Error("Réponse IA invalide. Réessayez.");
    }
    return {
      titre: cleanText(parsed.titre,180),
      description: cleanText(parsed.description,1500)
    };
  };

  function addAssistant(){
    if (document.getElementById("bilocost-gemini-launcher")) return;
    const style = document.createElement("style");
    style.id = "bilocost-gemini-style";
    style.textContent = `
      #bilocost-gemini-launcher{position:fixed;right:16px;bottom:86px;z-index:99990;border:0;border-radius:28px;padding:12px 16px;background:#16834a;color:#fff;font:600 14px system-ui;box-shadow:0 4px 18px #0003;cursor:pointer}
      #bilocost-gemini-panel{position:fixed;right:12px;bottom:142px;z-index:99991;width:min(360px,calc(100vw - 24px));height:min(480px,calc(100dvh - 180px));background:#fff;color:#17221b;border:1px solid #dce8df;border-radius:18px;box-shadow:0 8px 32px #0003;display:none;overflow:hidden;font:14px system-ui}
      #bilocost-gemini-panel.open{display:flex;flex-direction:column}
      #bilocost-gemini-head{display:flex;align-items:center;justify-content:space-between;background:#16834a;color:white;padding:13px 15px;font-weight:700}
      #bilocost-gemini-close{background:transparent;border:0;color:white;font-size:22px;cursor:pointer}
      #bilocost-gemini-log{flex:1;overflow:auto;padding:12px;background:#f7faf8}
      .bilocost-gemini-msg{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45;padding:10px 12px;border-radius:13px;margin:7px 0;max-width:90%}
      .bilocost-gemini-user{background:#e1f2e7;margin-left:auto}
      .bilocost-gemini-ai{background:#fff;border:1px solid #e4ebe6;margin-right:auto}
      #bilocost-gemini-form{display:flex;gap:7px;padding:10px;border-top:1px solid #e5ece7}
      #bilocost-gemini-input{min-width:0;flex:1;border:1px solid #d4ded7;border-radius:12px;padding:10px;font:14px system-ui}
      #bilocost-gemini-send{border:0;border-radius:12px;padding:0 14px;background:#16834a;color:white;font-weight:700}
      #bilocost-gemini-send:disabled{opacity:.55}
      @media(max-width:480px){#bilocost-gemini-panel{right:8px;bottom:138px;width:calc(100vw - 16px)}}
    `;
    document.head.appendChild(style);

    const launcher = document.createElement("button");
    launcher.id = "bilocost-gemini-launcher";
    launcher.type = "button";
    launcher.textContent = "✦ IA Bilocost";
    launcher.setAttribute("aria-label","Ouvrir l’assistant IA Bilocost");
    const panel = document.createElement("section");
    panel.id = "bilocost-gemini-panel";
    panel.setAttribute("aria-label","Assistant IA Bilocost");
    panel.innerHTML = '<div id="bilocost-gemini-head"><span>Assistant IA Bilocost</span><button id="bilocost-gemini-close" type="button" aria-label="Fermer">×</button></div><div id="bilocost-gemini-log"><div class="bilocost-gemini-msg bilocost-gemini-ai">Bonjour ! Je peux vous aider à utiliser Bilocost ou à préparer une annonce. Je ne peux pas consulter vos paiements ni vos données privées.</div></div><form id="bilocost-gemini-form"><input id="bilocost-gemini-input" maxlength="1800" autocomplete="off" placeholder="Posez votre question…" required><button id="bilocost-gemini-send" type="submit">Envoyer</button></form>';
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    const log = panel.querySelector("#bilocost-gemini-log");
    const input = panel.querySelector("#bilocost-gemini-input");
    const send = panel.querySelector("#bilocost-gemini-send");
    launcher.addEventListener("click",()=>panel.classList.toggle("open"));
    panel.querySelector("#bilocost-gemini-close").addEventListener("click",()=>panel.classList.remove("open"));
    panel.querySelector("#bilocost-gemini-form").addEventListener("submit",async event=>{
      event.preventDefault();
      const question = cleanText(input.value,1800);
      if(!question || requestBusy) return;
      const userMsg = document.createElement("div");
      userMsg.className = "bilocost-gemini-msg bilocost-gemini-user";
      userMsg.textContent = question;
      log.appendChild(userMsg);
      input.value = "";
      const pending = document.createElement("div");
      pending.className = "bilocost-gemini-msg bilocost-gemini-ai";
      pending.textContent = "Bilocost AI réfléchit…";
      log.appendChild(pending);
      log.scrollTop = log.scrollHeight;
      send.disabled = true;
      try {
        pending.textContent = await askGemini(question,"Assistance générale Bilocost");
      } catch(error) {
        pending.textContent = error && error.message ? error.message : "Une erreur est survenue. Réessayez.";
      } finally {
        send.disabled = false;
        log.scrollTop = log.scrollHeight;
        input.focus();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",addAssistant,{once:true});
  else addAssistant();
  // Initialize at startup so configuration errors are visible in the browser console.
  initGemini();
})();
