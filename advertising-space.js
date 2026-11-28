/* Bilocost advertiser space: fixed placements, durations and pre-approval payment. */
(function(){
  "use strict";
  if(window.__biloAdsSpaceInstalled)return;
  window.__biloAdsSpaceInstalled=true;
  const prices={slot1:{7:12,15:25,30:50},slot2:{7:7,15:15,30:30}};
  const fmt=n=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(n);
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let rate=null;
  const style=document.createElement("style");
  style.id="bilo-ads-space-style";
  style.textContent=`
  .bilo-ad-entry{margin:12px 0;padding:16px;border:1px solid var(--line);border-radius:16px;background:var(--card);color:var(--ink)}
  .bilo-ad-entry>button{width:100%;text-align:left}
  .bilo-ad-form{display:grid;gap:11px;margin-top:14px}
  .bilo-ad-form[hidden]{display:none!important}
  .bilo-ad-form label{display:grid;gap:6px;font-size:12px;font-weight:700;color:var(--mute)}
  .bilo-ad-form input,.bilo-ad-form textarea,.bilo-ad-form select{box-sizing:border-box;width:100%;min-height:44px;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);font:inherit}
  .bilo-ad-prices{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .bilo-ad-price{padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel);font-size:12px;color:var(--mute)}
  .bilo-ad-price strong{display:block;margin-top:4px;font-size:18px;color:var(--pri)}
  .bilo-ad-note{font-size:12px;line-height:1.5;color:var(--mute)}
  .bilo-ad-submit{width:100%;min-height:46px}
  .bilo-ad-feedback{font-size:13px;line-height:1.5}
  `;
  document.head.appendChild(style);
  async function getRate(){
    if(rate&&Number(rate.mean)>0)return rate;
    const snap=await firebase.firestore().doc("exchange_rates/current").get();
    if(!snap.exists||!(Number(snap.data().mean)>0))throw new Error("Le taux officiel CDF est momentanément indisponible. Réessayez plus tard.");
    rate=snap.data();return rate;
  }
  function formMarkup(){
    return `<section class="bilo-ad-entry">
      <button type="button" class="btn" data-bilo-ad-open>Faire connaître mon activité — Publicité Bilocost</button>
      <form class="bilo-ad-form" data-bilo-ad-form hidden>
        <h3 style="margin:4px 0">Créer une campagne publicitaire</h3>
        <label>Nom de l’entreprise ou de la campagne<input name="title" maxlength="100" required placeholder="Ex. Boutique Kanku"></label>
        <label>Lien de destination (HTTPS)<input name="url" type="url" required placeholder="https://..."></label>
        <label>Description<textarea name="description" maxlength="400" rows="3" placeholder="Présentez votre activité"></textarea></label>
        <label>Image publicitaire — URL HTTPS (facultatif)<input name="image" type="url" placeholder="https://..."></label>
        <label>Emplacement<select name="slot" required><option value="slot1">Emplacement 1 — Prioritaire, affiché en haut</option><option value="slot2">Emplacement 2 — Secondaire, affiché plus bas</option></select></label>
        <label>Durée<select name="durationDays" required><option value="7">7 jours</option><option value="15">15 jours</option><option value="30" selected>30 jours</option></select></label>
        <div class="bilo-ad-prices"><div class="bilo-ad-price">Prix fixe<strong data-bilo-ad-usd>50 USD</strong></div><div class="bilo-ad-price">Équivalent indicatif<strong data-bilo-ad-cdf>Calcul…</strong></div></div>
        <label>Référence du paiement effectué<input name="paymentReference" maxlength="100" required placeholder="Référence de transaction"></label>
        <p class="bilo-ad-note">Le paiement est exigé avant validation. Envoyez votre paiement selon les coordonnées officielles Bilocost communiquées par l’administration, puis indiquez sa référence ici. Votre publicité ne sera publiée qu’après vérification manuelle du paiement.</p>
        <button class="btn bilo-ad-submit" type="submit">Envoyer ma demande</button>
        <p class="bilo-ad-feedback" data-bilo-ad-feedback role="status" aria-live="polite"></p>
      </form></section>`;
  }
  function updatePrice(form){
    const slot=form.elements.slot.value, days=Number(form.elements.durationDays.value), usd=prices[slot]&&prices[slot][days];
    form.querySelector("[data-bilo-ad-usd]").textContent=usd+" USD";
    const cdf=form.querySelector("[data-bilo-ad-cdf]");
    cdf.textContent=rate&&usd?fmt(Math.round(usd*Number(rate.mean)/1000)*1000)+" CDF":"Taux indisponible";
  }
  if(typeof adSlots==="function"){
    const original=adSlots;
    adSlots=function(){return original()+formMarkup();};
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-bilo-ad-open]");
    if(!button)return;
    const form=button.parentElement.querySelector("[data-bilo-ad-form]");
    if(form)form.hidden=!form.hidden;
  });
  document.addEventListener("change",async event=>{
    const form=event.target.closest("[data-bilo-ad-form]");
    if(!form||!["slot","durationDays"].includes(event.target.name))return;
    try{await getRate();}catch(_){}
    updatePrice(form);
  });
  document.addEventListener("submit",async event=>{
    const form=event.target.closest("[data-bilo-ad-form]");
    if(!form)return;
    event.preventDefault();
    const feedback=form.querySelector("[data-bilo-ad-feedback]"), submit=form.querySelector('[type="submit"]');
    submit.disabled=true;feedback.textContent="Envoi de la demande…";
    try{
      if(!window.firebase||!firebase.auth().currentUser)throw new Error("Connectez-vous à votre compte Bilocost pour réserver un emplacement publicitaire.");
      const user=firebase.auth().currentUser, db=firebase.firestore(), liveRate=await getRate();
      const fd=new FormData(form), slot=String(fd.get("slot")), days=Number(fd.get("durationDays")), usd=prices[slot]&&prices[slot][days];
      if(!usd)throw new Error("Choisissez un emplacement et une durée valides.");
      const url=String(fd.get("url")||"").trim(), image=String(fd.get("image")||"").trim();
      if(!/^https:\/\//i.test(url)|| (image&&!/^https:\/\//i.test(image)))throw new Error("Les liens doivent commencer par https://.");
      const amountCDF=Math.round(usd*Number(liveRate.mean)/1000)*1000;
      await db.collection("adCampaignRequests").add({
        ownerId:user.uid,title:String(fd.get("title")||"").trim(),description:String(fd.get("description")||"").trim(),
        url,image,slot,durationDays:days,priceUSD:usd,priceCDF:amountCDF,
        exchangeRateCDF:Number(liveRate.mean),exchangeRateDate:String(liveRate.publicationDate||""),
        paymentReference:String(fd.get("paymentReference")||"").trim(),
        paymentStatus:"AWAITING_VERIFICATION",status:"PENDING_REVIEW",
        submittedAt:firebase.firestore.FieldValue.serverTimestamp()
      });
      feedback.textContent="Demande envoyée. Elle reste en attente jusqu’à la vérification de votre paiement par Bilocost.";
      form.reset();updatePrice(form);
    }catch(error){feedback.textContent=error.message||"Impossible d’envoyer la demande.";}
    finally{submit.disabled=false;}
  });
  const initRate=async()=>{try{await getRate();document.querySelectorAll("[data-bilo-ad-form]").forEach(updatePrice);}catch(error){console.warn("Bilocost ads exchange rate:",error.message);}};
  initRate();
})();