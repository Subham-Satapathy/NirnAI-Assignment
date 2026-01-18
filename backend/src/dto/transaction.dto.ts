import { IsString, IsOptional } from 'class-validator';

export class UploadPdfDto {
  @IsOptional()
  @IsString()
  buyerName?: string;

  @IsOptional()
  @IsString()
  sellerName?: string;

  @IsOptional()
  @IsString()
  houseNumber?: string;

  @IsOptional()
  @IsString()
  surveyNumber?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
