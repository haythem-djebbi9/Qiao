// Contrôles API du contenu des leçons : supports (fichiers protégés et liens), vidéo par lien, notes horodatées.
// Usage : API_URL=http://localhost:4000/api ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/academy/api-content.mjs
// À lancer sur une base de test : le script crée une formation, l'offre au membre de démo et y ajoute des notes.
const API = process.env.API_URL ?? 'http://localhost:4000/api';
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error('Définissez ADMIN_EMAIL et ADMIN_PASSWORD (administrateur de la base de test).');
const MEMBER = { email: 'sami.benali@qiao.tn', password: 'Qiao2026!' };

let failures = 0;
const check = (label, ok, extra = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK ' : 'ÉCHEC'} ${label}${extra ? ` — ${extra}` : ''}`);
};
async function call(method, path, token, body) {
  const isForm = body instanceof FormData;
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text };
}
const login = async (creds) => (await call('POST', '/auth/login', null, creds)).json?.token;
const upload = (token, purpose, name, mime, bytes) => {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime }), name);
  return call('POST', `/academy/admin/uploads?purpose=${purpose}`, token, form);
};

const admin = await login(ADMIN);
const member = await login(MEMBER);
const stamp = Date.now().toString(36);

// Supports téléversés : formats contrôlés
const pdf = await upload(admin, 'resource', 'fiche-synthese.pdf', 'application/pdf', new TextEncoder().encode('%PDF-1.4\n% QIAO\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'));
check('support PDF téléversé', pdf.status === 201 && pdf.json?.id, `${pdf.status} ${pdf.json?.message ?? ''}`);
const pptx = await upload(admin, 'resource', 'presentation.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]));
check('support PowerPoint téléversé', pptx.status === 201, `${pptx.status} ${pptx.json?.message ?? ''}`);
check('format interdit refusé (400)', (await upload(admin, 'resource', 'outil.exe', 'application/octet-stream', new Uint8Array([0x4d, 0x5a]))).status === 400);
check('faux PDF refusé (400)', (await upload(admin, 'resource', 'faux.pdf', 'application/pdf', new TextEncoder().encode('pas un pdf'))).status === 400);

// Formation avec une leçon vidéo (lien YouTube) et ses supports
const course = (await call('POST', '/academy/admin/courses', admin, {
  title: `Contenu test ${stamp}`,
  description: 'Formation de contrôle des supports et des notes horodatées.',
  instructor: 'Équipe QIAO',
  price: 0,
  durationMinutes: 30,
  domain: 'commerce',
  level: 'Débutant',
  format: 'En ligne à son rythme',
})).json;
const moduleId = (await call('POST', `/academy/admin/courses/${course.id}/modules`, admin, { title: 'Module 1 : Introduction' })).json.curriculum[0].id;
const badLink = await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, {
  title: 'Vidéo', type: 'video', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', durationMinutes: 5,
  resources: [{ kind: 'link', title: 'Lien non sécurisé', url: 'http://exemple.com' }],
});
check('lien de support http refusé (400)', badLink.status === 400);
const created = await call('POST', `/academy/admin/modules/${moduleId}/lessons`, admin, {
  title: 'Négocier avec un fournisseur',
  type: 'video',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  durationMinutes: 12,
  resources: [
    { kind: 'file', title: 'Fiche de synthèse', fileId: pdf.json.id },
    { kind: 'file', title: 'Présentation', fileId: pptx.json.id },
    { kind: 'link', title: 'Article complémentaire', url: 'https://www.qiao.test/article' },
  ],
});
const lesson = created.json?.curriculum?.[0]?.lessons?.[0];
check('leçon vidéo avec 3 supports', created.status === 201 && lesson?.resources?.length === 3, `${created.status} ${created.json?.message ?? ''}`);
check('éditeur : nom des fichiers de supports', lesson?.resources?.[0]?.file?.name === 'fiche-synthese.pdf');
const kept = await call('PATCH', `/academy/admin/lessons/${lesson.id}`, admin, { title: 'Négocier avec un fournisseur chinois' });
check('modification sans toucher aux supports', kept.json?.curriculum?.[0]?.lessons?.[0]?.resources?.length === 3);
await call('POST', `/academy/admin/courses/${course.id}/status`, admin, { status: 'published' });

// Accès aux supports : inscrits uniquement
check('support refusé au membre non inscrit (404)', (await call('GET', `/academy/files/${pdf.json.id}`, member)).status === 404);
check('support refusé sans connexion (401)', (await call('GET', `/academy/files/${pdf.json.id}`)).status === 401);
await call('POST', '/academy/admin/enrollments', admin, { email: MEMBER.email, itemType: 'course', itemId: course.id });
const view = (await call('GET', `/academy/learn/${course.id}`, member)).json;
const learnLesson = view?.modules?.[0]?.lessons?.[0];
check('lecteur : supports présentés', learnLesson?.resources?.length === 3 && learnLesson.resources[2].url === 'https://www.qiao.test/article');
const file = await call('GET', `/academy/files/${pdf.json.id}`, member);
check('support téléchargé par l’inscrit', file.status === 200 && file.text.startsWith('%PDF'), String(file.status));

// Notes horodatées
const n1 = await call('POST', `/academy/learn/${course.id}/lessons/${lesson.id}/notes`, member, { seconds: 125, text: 'Point clé : exiger un échantillon avant la commande.' });
const n2 = await call('POST', `/academy/learn/${course.id}/lessons/${lesson.id}/notes`, member, { seconds: 30, text: 'Introduction : rôle du guanxi.' });
check('notes créées', n1.status === 201 && n1.json.seconds === 125 && n2.status === 201);
check('note vide refusée (400)', (await call('POST', `/academy/learn/${course.id}/lessons/${lesson.id}/notes`, member, { seconds: 10, text: '' })).status === 400);
const list = (await call('GET', `/academy/learn/${course.id}/notes`, member)).json;
check('notes triées par instant', list?.length === 2 && list[0].seconds === 30 && list[1].seconds === 125);
const edited = await call('PATCH', `/academy/notes/${n1.json.id}`, member, { text: 'Point clé : échantillon et inspection.', seconds: 130 });
check('note modifiée', edited.json?.seconds === 130 && edited.json.text.includes('inspection'));
check('note d’autrui inaccessible (404)', (await call('PATCH', `/academy/notes/${n1.json.id}`, admin, { text: 'x' })).status === 404);
check('notes privées : l’admin ne les voit pas', ((await call('GET', `/academy/learn/${course.id}/notes`, admin)).json ?? []).length === 0);
check('note supprimée', (await call('DELETE', `/academy/notes/${n2.json.id}`, member)).json?.deleted === true);
check('notes refusées sans connexion (401)', (await call('GET', `/academy/learn/${course.id}/notes`, null)).status === 401);

console.log(`\nFormation de contrôle : ${course.id}`);
console.log(failures === 0 ? 'Tous les contrôles sont passés.' : `${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
