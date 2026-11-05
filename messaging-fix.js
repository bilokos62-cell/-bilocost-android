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
