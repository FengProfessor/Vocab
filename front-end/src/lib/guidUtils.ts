/**
 * Validation helpers for GUID identifiers issued by the .NET API.
 */
export class GuidUtils {
  private static readonly GUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Whether the value is a well-formed GUID (i.e. an entity that exists on the server).
   */
  public static isGuid(value: string): boolean {
    return GuidUtils.GUID_PATTERN.test(value);
  }
}
