import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Regions } from 'src/route/enum/regions.enum';

class PreferencesDetailsDto {
  @IsEnum(Regions, { each: true })
  regions: Regions[];
}
export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  readonly username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  readonly password: string;

  @ValidateNested()
  @Type(() => PreferencesDetailsDto)
  readonly preferences: PreferencesDetailsDto;
}
