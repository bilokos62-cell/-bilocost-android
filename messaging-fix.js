/* Bilocost messaging reliability patch — injected by the deployment workflow. */
function chatErrorText(e,stage){
 const code=(e&&e.code)||"";
 const where=stage?" ["+stage+"]":"";
 const detail=(e&&e.message)?String(e.message).slice(0,180):"";
 if(code==="permission-denied")return "Accès Firestore refusé"+where+". Vérifiez les participants et les règles. ("+code+")";
 if(code==="unauthenticated")return "Session Firebase expirée"+where+". Reconnectez-vous.";
 if(code==="failed-precondition")return "Précondition Firestore manquante"+where+". ("+code+")";
 if(code==="unavailable"||code==="deadline-exceeded")return "Connexion Firebase indisponible"+where+". Réessayez.";
 return "Erreur messagerie"+where+(code?" ("+code+")":"")+(detail?": "+detail:"");
}
async function ensureChat(cid,i){
 const who=i.s||i.sellerName||"Vendeur",ttl=i.t||i.title||"Annonce";
 if(!CLOUD){
  S.lchats[cid]=S.lchats[cid]||{id:cid,itemId:i.id,itemTitle:ttl,other:who,sellerId:i.sellerId||who,msgs:[],updatedAt:Date.now()};
  save();return;
 }
 if(!S.user||!S.user.uid)throw new Error("Session utilisateur absente");
 const sellerId=i.sellerId;
 if(typeof sellerId!=="string"||!sellerId.trim())throw new Error("Identifiant Firebase du vendeur absent sur cette annonce");
 if(sellerId===S.user.uid)throw new Error("Vous ne pouvez pas ouvrir une conversation avec vous-même");
 const F=FB.F,ref=F.doc(FB.db,"chats",cid),snap=await F.getDoc(ref);
 if(snap.exists()){
  const data=snap.data()||{};
  if(!Array.isArray(data.participants)||!data.participants.includes(S.user.uid))throw new Error("Cette conversation n'appartient pas à votre compte");
  return;
 }
 await F.setDoc(ref,{
  participants:[S.user.uid,sellerId],buyerId:S.user.uid,sellerId,
  buyerName:S.user.name||"Acheteur",sellerName:who,
  itemId:i.id,itemTitle:ttl,lastMessage:"",lastFrom:"",
  updatedAt:F.serverTimestamp()
 });
}
async function postMsg(cid,text,offer){
 if(containsPhoneNumber(text))throw new Error("Les numéros de téléphone ne sont pas autorisés dans la messagerie Bilocost.");
 if(!CLOUD){localPush(cid,{from:"me",text,...(offer?{offer}:{})});return;}
 if(!S.user||!S.user.uid)throw new Error("Session utilisateur absente");
 const F=FB.F,chatRef=F.doc(FB.db,"chats",cid);
 const snap=await F.getDoc(chatRef);
 if(!snap.exists())throw new Error("Conversation introuvable");
 const chat=snap.data()||{};
 if(!Array.isArray(chat.participants)||!chat.participants.includes(S.user.uid))throw new Error("Votre compte n'est pas participant de cette conversation");
 const msgRef=F.doc(F.collection(FB.db,"chats",cid,"messages"));
 const msg={from:S.user.uid,text,at:F.serverTimestamp(),...(offer?{offer}:{})};
 const batch=F.writeBatch(FB.db);
 batch.set(msgRef,msg);
 batch.update(chatRef,{lastMessage:text.slice(0,120),lastFrom:S.user.uid,updatedAt:F.serverTimestamp()});
 await batch.commit();
}
async function startChat(id){
 if(needUser())return;
 const i=findItem(id);if(!i)return;
 if(ownItem(i))return toast("C’est votre propre annonce");
 const cid=i.id+"_"+myId();
 try{await ensureChat(cid,i);openChat(cid,i.s,i.t,{itemId:i.id,buyerId:myId(),sellerId:i.sellerId,iAmBuyer:true});}
 catch(e){console.error("Bilocost startChat:",e);toast(chatErrorText(e,"ouverture conversation"));}
}
async function startEventChat(id){
 if(needUser())return;
 const e=S.events.find(x=>x.id==id);if(!e)return;
 if(CLOUD&&e.sellerId===S.user.uid)return toast("C’est votre événement");
 const cid="e_"+e.id+"_"+myId();
 try{await ensureChat(cid,e);openChat(cid,e.sellerName,e.title,{itemId:e.id,buyerId:myId(),sellerId:e.sellerId,iAmBuyer:true,event:true});}
 catch(e){console.error("Bilocost startEventChat:",e);toast(chatErrorText(e,"envoi du message"));}
}
async function sendToSeller(i,text,offer){
 if(needUser())return;
 if(ownItem(i))return toast("C’est votre propre annonce");
 if(containsPhoneNumber(text))return toast("Les numéros de téléphone sont interdits dans la messagerie Bilocost.");
 const cid=i.id+"_"+myId();
 try{await ensureChat(cid,i);await postMsg(cid,text,offer);close_();openChat(cid,i.s,i.t,{itemId:i.id,buyerId:myId(),sellerId:i.sellerId,iAmBuyer:true});}
 catch(e){console.error("Bilocost sendToSeller:",e);toast(chatErrorText(e,"préparation ou envoi"));}
}
function openChat(cid,other,ttl,info){
 S.chatId=cid;S.chatOther=other;S.chatTtl=ttl;
 const c=allChats().find(x=>x.id===cid);
 S.chatInfo=info||(c?{itemId:c.itemId,buyerId:c.buyerId,sellerId:c.sellerId,iAmBuyer:c.buyerId===myId(),event:String(cid).startsWith("e_")}:{iAmBuyer:true});
 S.readAt[cid]=Date.now();save();
 const panel=document.getElementById("sheetBody"); const overlay=document.getElementById("sheet"); if(!panel||!overlay) throw new Error("Interface de conversation introuvable"); panel.innerHTML=`<h2>${esc(other)}</h2><div class="sub">Objet : ${esc(ttl)}</div><div id="cond"></div><div id="ch" style="margin-top:8px"></div>${CLOUD?"":`<div class="warn"><b>Mode démonstration</b><br>Vos messages restent sur cet appareil : le vendeur ne les reçoit qu’avec la messagerie en ligne.</div>`}<div class="sort" style="margin-top:8px">${QREP.map((q,k)=>`<button class="chip" data-act="qrep" data-v="${k}">${esc(q)}</button>`).join("")}</div><div id="cw">${TIP}</div><div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:12px"><input class="f" id="cm" placeholder="Votre message"><button class="btn" style="width:auto" data-send>Envoyer</button></div><button class="btn ghost" data-close style="margin-top:10px">Fermer</button>`; overlay.classList.add("on");
 if(S.unChat){S.unChat();S.unChat=null;}
 if(!CLOUD){renderChat(S.lchats[cid]?S.lchats[cid].msgs:[]);render();return;}
 const F=FB.F;
 S.unChat=F.onSnapshot(F.query(F.collection(FB.db,"chats",cid,"messages"),F.orderBy("at","asc")),
  s=>renderChat(s.docs.map(d=>({id:d.id,...d.data()}))),
  e=>{console.error("Bilocost chat listener:",e);const el=$("#ch");if(el)el.innerHTML='<p class="warn">'+esc(chatErrorText(e,"écoute des messages"))+'</p>';});
}
async function sendMsg(){
 const field=$("#cm"),v=field?field.value.trim():"";if(!v)return;
 if(containsPhoneNumber(v))return toast("Envoi bloqué : les numéros congolais (243, 08…, 09…) sont interdits. Gardez vos échanges sur Bilocost.");
 try{await postMsg(S.chatId,v);if(field)field.value="";if(!CLOUD)renderChat(S.lchats[S.chatId].msgs);}
 catch(e){console.error("Bilocost sendMsg:",e);toast(chatErrorText(e));}
}


/* Conversation view: full-height reading space and unread message indicator. */
(function installBilocostMessagingUI(){
  if(window.__biloMessagingUiV2)return;
  window.__biloMessagingUiV2=true;
  const css=document.createElement("style");
  css.id="bilo-messaging-ui-v2";
  css.textContent=`
    #sheet.bilo-chat-fullscreen{position:fixed!important;inset:0!important;z-index:1200!important;display:flex!important;align-items:stretch!important;justify-content:stretch!important;padding:0!important;background:rgba(5,15,10,.58)!important}
    #sheet.bilo-chat-fullscreen #sheetBody{position:relative!important;inset:auto!important;width:100%!important;max-width:none!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:calc(16px + env(safe-area-inset-top,0px)) 16px calc(14px + env(safe-area-inset-bottom,0px))!important;border-radius:0!important;overflow-y:auto!important;overscroll-behavior:contain;display:flex!important;flex-direction:column!important;gap:10px!important}
    #sheet.bilo-chat-fullscreen #sheetBody>h2{font-size:21px!important;margin:4px 0 0!important}
    #sheet.bilo-chat-fullscreen #ch{flex:1 1 auto!important;min-height:180px!important;max-height:none!important;overflow-y:auto!important;overscroll-behavior:contain;padding:12px 2px!important;border-radius:14px;scroll-behavior:smooth}
    #sheet.bilo-chat-fullscreen #cm{min-height:50px!important;font-size:16px!important}
    #sheet.bilo-chat-fullscreen [data-send]{min-height:50px!important;padding-inline:18px!important}
    #sheet.bilo-chat-fullscreen [data-close]{flex:0 0 auto!important;margin-top:2px!important}
    nav button[data-t="msg"]{position:relative!important;overflow:visible!important}
    nav button[data-t="msg"] .bilo-unread-badge{position:absolute;top:2px;right:calc(50% - 25px);min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e53935;color:#fff;font-size:11px;font-weight:800;line-height:18px;text-align:center;box-shadow:0 0 0 2px var(--bar,#fff);pointer-events:none;z-index:5}
    @media(max-width:380px){#sheet.bilo-chat-fullscreen #sheetBody{padding-left:12px!important;padding-right:12px!important}}
  `;
  document.head.appendChild(css);

  function syncChatSheet(){
    const sheet=document.getElementById("sheet");
    if(!sheet)return;
    const active=!!sheet.querySelector("#cm");
    sheet.classList.toggle("bilo-chat-fullscreen",active);
  }
  function millis(value){
    if(!value)return 0;
    if(typeof value==="number")return value;
    if(value.toMillis)return value.toMillis();
    if(value.toDate)return value.toDate().getTime();
    const n=Date.parse(value);
    return Number.isFinite(n)?n:0;
  }
  function syncUnreadBadge(){
    try{
      const nav=document.querySelector('nav button[data-t="msg"]');
      if(!nav)return;
      let badge=nav.querySelector(".bilo-unread-badge");
      if(!badge){badge=document.createElement("span");badge.className="bilo-unread-badge";badge.setAttribute("aria-label","Messages non lus");badge.setAttribute("aria-live","polite");nav.appendChild(badge);}
      const me=(S.user&&S.user.uid)||myId();
      const chats=typeof allChats==="function"?(allChats()||[]):[];
      let count=0;
      for(const chat of chats){
        if(!chat||!chat.id)continue;
        const msgs=Array.isArray(chat.msgs)?chat.msgs:null;
        const readAt=Number((S.readAt&&S.readAt[chat.id])||0);
        if(msgs){
          count+=msgs.filter(m=>{
            const sender=m.from||m.senderId;
            const at=millis(m.at||m.createdAt||m.timestamp);
            return sender&&sender!==me&&at>readAt;
          }).length;
        }else if(chat.lastFrom&&chat.lastFrom!==me&&millis(chat.updatedAt)>readAt){
          count++;
        }
      }
      badge.textContent=count>99?"99+":String(count);
      badge.style.display=count?"inline-block":"none";
      nav.setAttribute("aria-label",count?("Messages, "+count+" non lus"):"Messages");
    }catch(error){console.warn("Bilocost unread badge:",error);}
  }
  function refreshMessagingUI(){
    syncChatSheet();
    syncUnreadBadge();
  }
  refreshMessagingUI();
  const root=document.getElementById("sheet")||document.body;
  if(window.MutationObserver){
    new MutationObserver(refreshMessagingUI).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
    const nav=document.querySelector("nav");
    if(nav)new MutationObserver(syncUnreadBadge).observe(nav,{childList:true,subtree:true});
  }
  document.addEventListener("click",event=>{
    if(event.target.closest('nav button[data-t="msg"]'))setTimeout(syncUnreadBadge,80);
    if(event.target.closest("#sheet [data-close]"))setTimeout(refreshMessagingUI,80);
  });
  const priorRender=render;
  render=function(){priorRender();refreshMessagingUI();};
})();
