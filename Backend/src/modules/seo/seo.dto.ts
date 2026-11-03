import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsObject, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

/** Contenus pris en charge par l'assistant SEO / GEO (formulaires d'ajout de l'administration). */
export const SEO_KINDS = ['course', 'path', 'event'] as const;
export type SeoKind = (typeof SEO_KINDS)[number];

export class SeoAnalyzeDto {
  @IsIn(SEO_KINDS, { message: 'Type de contenu invalide.' })
  kind: SeoKind;

  /** Champs du formulaire en cours de saisie (libellé → valeur), nettoyés côté serveur. */
  @IsObject()
  fields: Record<string, unknown>;
}

export class SeoChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text: string;
}

export class SeoChatDto extends SeoAnalyzeDto {
  @IsArray()
  @ArrayMaxSize(20, { message: 'Conversation trop longue : recommencez-en une nouvelle.' })
  @ValidateNested({ each: true })
  @Type(() => SeoChatMessageDto)
  messages: SeoChatMessageDto[];
}
