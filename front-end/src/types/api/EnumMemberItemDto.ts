/**
 * Represents a single enum member entry returned by GET /api/v1/system/enums from the .NET 10 backend.
 */
export interface EnumMemberItemDto {
  /** Canonical PascalCase enum member identifier. */
  name: string;

  /** Underlying integer ordinal value in the C# domain enum. */
  numericValue: number;
}
