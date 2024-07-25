import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';

class PreferencesDetailsDto {
  @IsBoolean()
  show_all_routes: boolean;
}

export class AdminPreferencesDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PreferencesDetailsDto)
  readonly preferences: PreferencesDetailsDto;
}
