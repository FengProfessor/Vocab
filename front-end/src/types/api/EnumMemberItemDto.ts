/**
 * Represents a single enum member entry returned by GET /api/v1/system/enums from the .NET 10 backend.
 */
export interface EnumMemberItemDto {
  /** Canonical PascalCase enum member identifier. */
  name: string;

  /** Synchronized string value defined via Display(Name = "...") in the C# domain enum. */
  value: string;
}
