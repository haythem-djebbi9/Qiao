import PDFDocument from 'pdfkit';
import { QiaoDocument } from './document.entities';

export interface RenderedFile {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

const RED = '#dc2626';
const NAVY = '#07152b';

/** Les polices standard PDF ne couvrent que le jeu Latin : on remplace les symboles hors jeu. */
function pdfSafe(text: string): string {
  return text
    .replace(/[→➔]/g, '->')
    .replace(/[↔]/g, '<->')
    .replace(/[≈]/g, '~')
    .replace(/[^\u0000-ÿ–—‘’“”…€]/g, '');
}

function sections(doc: QiaoDocument): { heading: string; paragraphs: string[] }[] {
  const countries = doc.countries?.length ? doc.countries.join(', ') : 'Chine et Afrique du Nord';
  const sector = doc.sector ?? 'commerce bilatéral';
  return [
    {
      heading: '1. Contexte et enjeux',
      paragraphs: [
        doc.description,
        `Ce document s'adresse aux entreprises, investisseurs et institutions actifs sur le corridor ${countries}. Il synthétise les dernières données disponibles dans le domaine « ${sector} » et les retours terrain des équipes QIAO basées à Tunis, Casablanca, Alger et Shanghai.`,
      ],
    },
    {
      heading: '2. Points clés',
      paragraphs: [
        '- Cadre réglementaire et formalités à anticiper avant tout engagement contractuel.',
        '- Acteurs de référence, partenaires vérifiés et canaux de distribution recommandés.',
        '- Coûts logistiques indicatifs, délais de transit et points de vigilance douaniers.',
        '- Opportunités prioritaires identifiées par QIAO Intelligence pour les 12 prochains mois.',
      ],
    },
    {
      heading: '3. Recommandations QIAO',
      paragraphs: [
        "Sécuriser chaque étape par des contrats bilingues, vérifier les certifications des partenaires et s'appuyer sur un interlocuteur local biculturel. Nos experts peuvent réaliser un diagnostic personnalisé de votre projet.",
      ],
    },
    {
      heading: '4. Aller plus loin',
      paragraphs: [
        'Réservez une consultation gratuite de 30 minutes depuis la plateforme QIAO ou écrivez à contact@qiao.tn en indiquant la référence de ce document.',
      ],
    },
  ];
}

interface PdfContent {
  kind: string;
  title: string;
  meta: string;
  author: string;
  sections: { heading: string; paragraphs: string[] }[];
}

function renderPdf(content: PdfContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: 'A4', margin: 56, info: { Title: pdfSafe(content.title), Author: content.author } });
    const chunks: Buffer[] = [];
    pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    pdf.rect(0, 0, pdf.page.width, 110).fill(NAVY);
    pdf.rect(0, 110, pdf.page.width, 4).fill(RED);
    pdf.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('QIAO', 56, 36);
    pdf.font('Helvetica').fontSize(10).fillColor('#cbd5e1').text('Le pont entre la Chine et l’Afrique du Nord', 56, 64);
    pdf.fillColor('#fca5a5').fontSize(9).text(pdfSafe(content.kind.toUpperCase()), 56, 82);

    pdf.moveDown(4);
    pdf.fillColor(NAVY).font('Helvetica-Bold').fontSize(20).text(pdfSafe(content.title), 56, 150, { width: pdf.page.width - 112 });
    pdf.moveDown(0.6);
    pdf.font('Helvetica').fontSize(10).fillColor('#475569').text(pdfSafe(content.meta));
    pdf.moveDown(1.2);

    for (const section of content.sections) {
      pdf.font('Helvetica-Bold').fontSize(13).fillColor(RED).text(pdfSafe(section.heading));
      pdf.moveDown(0.3);
      for (const paragraph of section.paragraphs) {
        pdf.font('Helvetica').fontSize(11).fillColor('#1e293b').text(pdfSafe(paragraph), { align: 'justify', lineGap: 2 });
        pdf.moveDown(0.4);
      }
      pdf.moveDown(0.6);
    }

    pdf
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(pdfSafe(`Document généré le ${new Date().toLocaleDateString('fr-FR')} pour les membres QIAO — usage professionnel.`), 56, pdf.page.height - 70, {
        width: pdf.page.width - 112,
        align: 'center',
      });
    pdf.end();
  });
}

function renderWord(doc: QiaoDocument): Buffer {
  const body = sections(doc)
    .map((s) => `<h2 style="color:${RED}">${s.heading}</h2>${s.paragraphs.map((p) => `<p>${p}</p>`).join('')}`)
    .join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${doc.title}</title></head>
<body style="font-family:Calibri,Arial,sans-serif">
<p style="color:${NAVY};font-size:20pt;font-weight:bold">QIAO — ${doc.kind}</p>
<h1 style="color:${NAVY}">${doc.title}</h1>
<p style="color:#475569">${doc.publisher} | ${doc.dateLabel} | Réf. ${doc.id}</p>
${body}
<h2 style="color:${RED}">Modèle à compléter</h2>
<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
<tr><td><b>Partie A (Chine)</b></td><td>Raison sociale, adresse, représentant légal</td></tr>
<tr><td><b>Partie B (Afrique du Nord)</b></td><td>Raison sociale, adresse, représentant légal</td></tr>
<tr><td><b>Objet</b></td><td></td></tr>
<tr><td><b>Durée et territoire</b></td><td></td></tr>
<tr><td><b>Loi applicable et arbitrage</b></td><td>CIETAC / CCI — langue de référence : français et chinois</td></tr>
</table>
</body></html>`;
  return Buffer.from(`﻿${html}`, 'utf8');
}

function renderCsv(doc: QiaoDocument): Buffer {
  const rows = [
    ['Indicateur', 'Chine', 'Tunisie', 'Algérie', 'Maroc', 'Égypte', 'Libye'],
    ['Échanges bilatéraux 2024 (Mds USD)', '—', '2,1', '10,8', '7,4', '15,8', '3,2'],
    ['Croissance annuelle (%)', '—', '8,4', '6,9', '9,1', '7,6', '4,2'],
    ['Droits de douane moyens (%)', '7,5', '14,0', '18,0', '12,5', '16,0', '10,0'],
    ['TVA import (%)', '13', '19', '19', '20', '14', '0'],
    ['Délai de transit maritime depuis Shanghai (jours)', '—', '28', '30', '26', '24', '32'],
  ];
  const csv = [`# ${doc.title} — ${doc.publisher} (${doc.dateLabel})`, ...rows.map((r) => r.map((c) => `"${c}"`).join(';'))].join('\r\n');
  return Buffer.from(`﻿${csv}`, 'utf8');
}

export async function renderDocument(doc: QiaoDocument): Promise<RenderedFile> {
  const base = doc.id;
  if (doc.format === 'DOCX') {
    return { buffer: renderWord(doc), filename: `${base}.doc`, contentType: 'application/msword' };
  }
  if (doc.format === 'XLSX') {
    return { buffer: renderCsv(doc), filename: `${base}.csv`, contentType: 'text/csv; charset=utf-8' };
  }
  const buffer = await renderPdf({
    kind: doc.kind,
    title: doc.title,
    meta: `${doc.publisher}  |  ${doc.dateLabel}  |  ${doc.category}  |  Réf. ${doc.id}`,
    author: doc.publisher,
    sections: sections(doc),
  });
  return { buffer, filename: `${base}.pdf`, contentType: 'application/pdf' };
}

export interface ArticleContent {
  id: string;
  title: string;
  category: string;
  dateLabel: string;
  readTime: string;
  author: string;
  summary: string;
  keyPoints: string[];
  content: string[];
}

export async function renderArticle(article: ArticleContent): Promise<RenderedFile> {
  const buffer = await renderPdf({
    kind: `Analyse — ${article.category}`,
    title: article.title,
    meta: `${article.author}  |  ${article.dateLabel}  |  ${article.readTime}`,
    author: article.author,
    sections: [
      { heading: 'Résumé', paragraphs: [article.summary] },
      { heading: 'Points clés', paragraphs: article.keyPoints.map((point) => `- ${point}`) },
      { heading: 'Analyse', paragraphs: article.content },
    ],
  });
  return { buffer, filename: `${article.id}.pdf`, contentType: 'application/pdf' };
}
