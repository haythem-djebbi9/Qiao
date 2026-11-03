import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Protocole du serveur de messages du compte officiel WeChat (公众号 « 服务器配置 ») :
 * signature SHA-1 du jeton, XML plat, et « mode sécurisé » (AES-256-CBC, EncodingAESKey).
 */

/** signature = sha1(tri lexicographique des éléments concaténés). */
export function wechatSignature(...parts: string[]): string {
  return createHash('sha1').update([...parts].sort().join('')).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a ?? '');
  const right = Buffer.from(b ?? '');
  return left.length === right.length && timingSafeEqual(left, right);
}

const XML_FIELD = /<(\w+)>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/\1>/g;

/** Lecture du XML plat envoyé par WeChat (un niveau, valeurs CDATA ou texte). */
export function parseWechatXml(xml: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const match of xml.matchAll(XML_FIELD)) {
    if (match[1] === 'xml') continue;
    // Un « ]]> » dans le texte est découpé en deux sections CDATA : on le reconstitue.
    fields[match[1]] = match[2] !== undefined ? match[2].replace(/\]\]\]\]><!\[CDATA\[>/g, ']]>') : decodeEntities(match[3] ?? '');
  }
  return fields;
}

function decodeEntities(value: string) {
  return value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

const cdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export function buildWechatXml(fields: Record<string, string | number>): string {
  const body = Object.entries(fields)
    .map(([key, value]) => `<${key}>${typeof value === 'number' ? value : cdata(value)}</${key}>`)
    .join('');
  return `<xml>${body}</xml>`;
}

/** Réponse passive « texte » (envoyée dans la réponse HTTP, sans limite de fenêtre). */
export function textReply(toOpenid: string, fromAccount: string, content: string): string {
  return buildWechatXml({
    ToUserName: toOpenid,
    FromUserName: fromAccount,
    CreateTime: Math.floor(Date.now() / 1000),
    MsgType: 'text',
    Content: content,
  });
}

/** Chiffrement du « mode sécurisé » (format WXBizMsgCrypt). */
export class WechatCipher {
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(
    encodingAesKey: string,
    private readonly appId: string,
  ) {
    this.key = Buffer.from(`${encodingAesKey}=`, 'base64');
    if (this.key.length !== 32) throw new Error('WECHAT_OA_ENCODING_AES_KEY invalide (43 caractères attendus).');
    this.iv = this.key.subarray(0, 16);
  }

  decrypt(encrypted: string): string {
    const decipher = createDecipheriv('aes-256-cbc', this.key, this.iv);
    decipher.setAutoPadding(false);
    let plain = Buffer.concat([decipher.update(encrypted, 'base64'), decipher.final()]);
    const pad = plain[plain.length - 1];
    if (pad < 1 || pad > 32) throw new Error('Remplissage invalide.');
    plain = plain.subarray(0, plain.length - pad);
    const length = plain.readUInt32BE(16);
    const message = plain.subarray(20, 20 + length).toString('utf8');
    const appId = plain.subarray(20 + length).toString('utf8');
    if (appId !== this.appId) throw new Error('Message destiné à un autre compte officiel.');
    return message;
  }

  encrypt(message: string): string {
    const body = Buffer.from(message, 'utf8');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(body.length);
    const raw = Buffer.concat([randomBytes(16), length, body, Buffer.from(this.appId, 'utf8')]);
    const pad = 32 - (raw.length % 32);
    const cipher = createCipheriv('aes-256-cbc', this.key, this.iv);
    cipher.setAutoPadding(false);
    return Buffer.concat([cipher.update(Buffer.concat([raw, Buffer.alloc(pad, pad)])), cipher.final()]).toString('base64');
  }
}

/** Tronque un texte à `max` caractères (affichage dans WeChat). */
export function truncate(text: string, max: number): string {
  const chars = [...text];
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`;
}
