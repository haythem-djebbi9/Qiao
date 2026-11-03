// Aide des scripts de contrôle : inscription à une formation payante réglée par virement validé par l'administrateur.
// Le virement est activé avec des coordonnées de test s'il ne l'est pas encore (base de test uniquement).

export async function ensureTransfer(call, admin) {
  const settings = (await call('GET', '/academy/admin/payment-settings', admin)).json;
  if (settings?.bank?.beneficiary && (settings.bank.rib || settings.bank.iban)) return;
  await call('PATCH', '/academy/admin/payment-settings', admin, {
    bank: { beneficiary: 'QIAO TEST', bankName: 'Banque de test', rib: '00000000000000000000', instructions: 'Coordonnées de test.' },
  });
}

/** Inscription du membre ; une commande en attente est validée par l'administrateur (virement reçu). */
export async function enrollPaid(call, admin, member, item) {
  await ensureTransfer(call, admin);
  const res = await call('POST', '/academy/enroll', member, { ...item, method: 'transfer' });
  if (res.status === 201 && res.json?.order?.status === 'pending') {
    const validated = await call('POST', `/academy/admin/orders/${res.json.order.id}/validate`, admin, { note: 'Script de contrôle' });
    return { ...res, json: { ...res.json, order: validated.json } };
  }
  return res;
}
