import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, ValidateNested } from 'class-validator';

class PreferencesDetailsDto {
  @IsBoolean()
  show_all_routes: boolean;

  @IsBoolean()
  show_all_places: boolean;
}

export class AdminPreferencesDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PreferencesDetailsDto)
  readonly preferences: PreferencesDetailsDto;
}
