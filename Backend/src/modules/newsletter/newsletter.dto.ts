import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const NEWSLETTER_TOPICS = ['general', 'events', 'reports', 'resources', 'analyses'] as const;
export type NewsletterTopic = (typeof NEWSLETTER_TOPICS)[number];

export class SubscribeDto {
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsOptional()
  @IsIn([...NEWSLETTER_TOPICS])
  topic?: NewsletterTopic;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}
