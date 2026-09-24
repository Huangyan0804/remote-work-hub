import { IsString, MaxLength, ValidateIf } from "class-validator";

export class UpdateFocusDto {
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(255)
  focus: string | null;
}
