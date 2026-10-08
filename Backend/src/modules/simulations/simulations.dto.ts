import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsNumber, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class ComputeSimulationDto {
  @IsIn(['Tunisie', 'Algérie', 'Maroc', 'Égypte'], { message: 'Pays de destination non couvert.' })
  destCountry: string;

  @IsIn(['machinery', 'electronics', 'textile', 'raw_materials', 'medical'], { message: 'Catégorie de produit invalide.' })
  category: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'La valeur FOB doit être un nombre.' })
  @Min(100, { message: 'La valeur FOB minimale est de 100 USD.' })
  @Max(50_000_000, { message: 'Pour plus de 50 M USD, contactez directement nos experts.' })
  fobValue: number;

  @IsIn(['sea', 'air'])
  shippingMode: 'sea' | 'air';

  @IsIn(['20ft', '40ft', 'lcl'])
  containerType: '20ft' | '40ft' | 'lcl';
}

export class QuoteRequestDto extends ComputeSimulationDto {
  @IsString()
  @Length(2, 120, { message: 'Le nom complet est obligatoire.' })
  fullName: string;

  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
