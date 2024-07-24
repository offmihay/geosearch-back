import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Regions } from 'src/route/enum/regions.enum';

class PreferencesDetailsDto {
  @IsEnum(Regions, { each: true })
  regions: Regions[];

  @IsBoolean()
  show_all_routes: boolean;
}

export class PreferencesDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PreferencesDetailsDto)
  readonly preferences: PreferencesDetailsDto;
}
