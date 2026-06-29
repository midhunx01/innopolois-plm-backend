/**
 * Intelligent material code — FRD §4.
 *
 *   TT-SS-MM-DDDD
 *   TT   = Material Type   (category 2-letter code)
 *   SS   = Subtype         (2-letter code)
 *   MM   = Major Spec      (size / rating, 2 chars)
 *   DDDD = Detailed Spec   (grade / detail, up to 4 chars)
 *
 * e.g. MB-VA-15-3040 = Mechanical Bought-out Valve, 15 mm, SS304.
 */
export function buildMaterialCode(
  typeCode: string,
  subtypeCode: string,
  majorSpec: string,
  detailSpec: string
): string {
  return [typeCode, subtypeCode, majorSpec, detailSpec]
    .map((p) => p.trim().toUpperCase())
    .join("-");
}
