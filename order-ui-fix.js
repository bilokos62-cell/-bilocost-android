/* Bilocost order UI correction: never present an unavailable payment as actionable. */
(function(){
  if(window.__biloOrderUiFixInstalled)return;
  if(typeof condHtml!=="function")return;
  window.__biloOrderUiFixInstalled=true;
  const originalCondHtml=condHtml;
  condHtml=function(messages){
    let html=originalCondHtml(messages);
    const paymentReady=!!(PAY&&PAY.escrow&&PAY.escrow.ready&&PAY.methods&&PAY.methods.some(m=>m.ready));
    if(!paymentReady){
      html=html.replace(
        /<button class="btn" data-act="payterms"[^>]*>Payer[^<]*<\/button>/,
        '<button class="btn" type="button" disabled aria-disabled="true">Paiement indisponible</button>'
      );
      html=html.replace(
        "Après le paiement : attendez la livraison, puis donnez le code de remise à la réception.",
        "Le paiement sécurisé n’est pas encore disponible. Convenez de la remise avec le vendeur ; aucun paiement ne sera demandé ici."
      );
    }
    return html;
  };
})();