import type { PlaceGeometryType, PlaceSearchCriteria } from "places-core";
import { isAllowedOsmTagKey } from "places-core";
import { type ProblemDetails, problem } from "../http/problem.js";

const COUNTRY_CODE_PATTERN = /^[A-Za-z]{2}$/;

const GEOMETRY_TYPES = new Set<PlaceGeometryType>([
  "POINT",
  "POLYGON",
  "MULTIPOLYGON",
]);

/**
 * Result of validating a search criteria body.
 */
export type CriteriaValidation =
  | { ok: true; value: PlaceSearchCriteria }
  | { ok: false; problem: ProblemDetails };

/**
 * Result of validating an export request body.
 */
export type ExportValidation =
  | {
      ok: true;
      value: { criteria: PlaceSearchCriteria; geometryType: PlaceGeometryType };
    }
  | { ok: false; problem: ProblemDetails };

/**
 * Validates a Places search criteria JSON object.
 * @param body Parsed JSON body.
 */
export function validatePlaceSearchCriteria(body: unknown): CriteriaValidation {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      problem: problem(
        422,
        "Validation failed",
        "Request body must be a JSON object.",
        "/validation",
      ),
    };
  }

  const errors: Record<string, string[]> = {};
  const allowedKeys = new Set([
    "brand",
    "categoryId",
    "city",
    "countryCode",
    "nameContains",
    "osmTagKey",
    "osmTagValue",
    "region",
  ]);

  for (const key of Object.keys(body)) {
    if (!allowedKeys.has(key)) {
      errors[key] = ["is not an allowed property"];
    }
  }

  const criteria: PlaceSearchCriteria = {};

  assignOptionalString(body, "brand", criteria, errors);
  assignOptionalString(body, "categoryId", criteria, errors);
  assignOptionalString(body, "city", criteria, errors);
  assignOptionalString(body, "countryCode", criteria, errors);
  assignOptionalString(body, "nameContains", criteria, errors);
  assignOptionalString(body, "osmTagKey", criteria, errors);
  assignOptionalString(body, "osmTagValue", criteria, errors);
  assignOptionalString(body, "region", criteria, errors);

  if (
    criteria.countryCode &&
    !COUNTRY_CODE_PATTERN.test(criteria.countryCode)
  ) {
    errors.countryCode = ["must be a 2-letter ISO country code"];
  } else if (criteria.countryCode) {
    criteria.countryCode = criteria.countryCode.toUpperCase();
  }

  const key = criteria.osmTagKey?.trim() ?? "";
  const value = criteria.osmTagValue?.trim() ?? "";
  if (Boolean(key) !== Boolean(value)) {
    errors.osmTagKey = ["set both osmTagKey and osmTagValue, or clear them"];
    errors.osmTagValue = ["set both osmTagKey and osmTagValue, or clear them"];
  } else if (key && !isAllowedOsmTagKey(key)) {
    errors.osmTagKey = [`unsupported OSM tag key: ${key}`];
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      problem: problem(
        422,
        "Validation failed",
        "One or more fields are invalid",
        "/validation",
        errors,
      ),
    };
  }

  return { ok: true, value: criteria };
}

/**
 * Validates a Places export JSON body (`criteria` + `geometryType`).
 * @param body Parsed JSON body.
 */
export function validatePlaceExportBody(body: unknown): ExportValidation {
  if (!isPlainObject(body)) {
    return {
      ok: false,
      problem: problem(
        422,
        "Validation failed",
        "Request body must be a JSON object.",
        "/validation",
      ),
    };
  }

  const errors: Record<string, string[]> = {};
  for (const key of Object.keys(body)) {
    if (key !== "criteria" && key !== "geometryType") {
      errors[key] = ["is not an allowed property"];
    }
  }

  const { geometryType } = body;
  if (
    typeof geometryType !== "string" ||
    !GEOMETRY_TYPES.has(geometryType as PlaceGeometryType)
  ) {
    errors.geometryType = ["must be POINT, POLYGON, or MULTIPOLYGON"];
  }

  const criteriaResult = validatePlaceSearchCriteria(body.criteria);
  if (!criteriaResult.ok) {
    const nested = criteriaResult.problem.errors ?? {
      criteria: [criteriaResult.problem.detail],
    };
    return {
      ok: false,
      problem: problem(
        422,
        "Validation failed",
        "Export criteria are invalid",
        "/validation",
        { ...nested, ...errors },
      ),
    };
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      problem: problem(
        422,
        "Validation failed",
        "One or more fields are invalid",
        "/validation",
        errors,
      ),
    };
  }

  return {
    ok: true,
    value: {
      criteria: criteriaResult.value,
      geometryType: geometryType as PlaceGeometryType,
    },
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assignOptionalString(
  body: Record<string, unknown>,
  key: string,
  target: PlaceSearchCriteria,
  errors: Record<string, string[]>,
): void {
  if (!(key in body) || body[key] === undefined) {
    return;
  }
  if (typeof body[key] !== "string") {
    errors[key] = ["must be a string"];
    return;
  }
  (target as Record<string, string | undefined>)[key] = body[key];
}
