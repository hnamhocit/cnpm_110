import {
  scheduleFields,
  validateSchedule,
  type CategoryConfig,
  type CategoryInput,
  type ContestAward,
  type ContestRound,
  type Criterion,
  type Schedule,
  type Settings,
} from "../services/contest-configuration";
import { AppError } from "../utils/errors";

export type Body = Record<string, unknown>;

function object(value: unknown): Body {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw AppError.badRequest("Expected an object");
  }
  return value as Body;
}

export function requiredText(value: unknown, label: string, limit: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > limit) {
    throw AppError.badRequest(`Invalid ${label}`);
  }
  return value.trim();
}

function optionalText(value: unknown, label: string, limit: number) {
  if (value === undefined || value === null) return value;
  if (typeof value !== "string" || value.length > limit) throw AppError.badRequest(`Invalid ${label}`);
  return value.trim();
}

function integer(value: unknown, label: string, min = 1): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min) {
    throw AppError.badRequest(`Invalid ${label}`);
  }
  return value;
}

function list<T>(value: unknown, label: string, parse: (item: Body, index: number) => T): T[] {
  if (!Array.isArray(value)) throw AppError.badRequest(`Invalid ${label}`);
  return value.map((item, index) => parse(object(item), index));
}

function unique<T>(values: T[], label: string) {
  if (new Set(values).size !== values.length) throw AppError.badRequest(`Duplicate ${label}`);
}

export function schedulePatch(body: Body): Partial<Schedule> {
  const parsed: Partial<Schedule> = {};
  for (const [field, column] of Object.entries(scheduleFields) as [string, keyof Schedule][]) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(value)
      || Number.isNaN(Date.parse(value))) {
      throw AppError.badRequest(`MSG008: Invalid timestamp for ${field}`);
    }
    parsed[column] = new Date(value);
  }
  return parsed;
}

export function fullSchedule(body: Body): Schedule {
  const dates = schedulePatch(body) as Schedule;
  validateSchedule(dates);
  return dates;
}

export function settingsPatch(body: Body): Settings {
  const settings: Settings = {};
  if (body.theme !== undefined) settings.theme = optionalText(body.theme, "theme", 255);
  if (body.rules !== undefined) settings.rules = optionalText(body.rules, "rules", 20_000);
  if (body.coverImageUrl !== undefined) {
    const url = optionalText(body.coverImageUrl, "coverImageUrl", 2048);
    if (url && !["https:", "http:"].includes(URL.parse(url)?.protocol ?? "")) {
      throw AppError.badRequest("Invalid coverImageUrl");
    }
    settings.coverImageUrl = url;
  }
  if (body.rounds !== undefined) {
    settings.rounds = list<ContestRound>(body.rounds, "rounds", (round) => ({
      name: requiredText(round.name, "round name", 150),
      order: integer(round.order, "round order"),
      advanceCount: round.advanceCount == null ? null : integer(round.advanceCount, "advanceCount"),
    }));
    unique(settings.rounds.map(({ order }) => order), "round order");
  }
  if (body.awards !== undefined) {
    settings.awards = list<ContestAward>(body.awards, "awards", (award) => ({
      code: requiredText(award.code, "award code", 50),
      name: requiredText(award.name, "award name", 150),
      rankOrder: integer(award.rankOrder, "rankOrder"),
      prizeValueVnd: integer(award.prizeValueVnd ?? 0, "prizeValueVnd", 0),
      quota: integer(award.quota ?? 1, "quota"),
    }));
    unique(settings.awards.map(({ code }) => code), "award code");
  }
  return settings;
}

export function parseCriteria(value: unknown): Criterion[] {
  let total = 0;
  const criteria = list(value, "criteria", (item, index) => {
    const { weight, maxScore = 10 } = item;
    if (typeof weight !== "number" || !/^(?:0\.\d{1,4}|1)$/.test(String(weight)) || weight <= 0) {
      throw AppError.badRequest("Invalid criterion weight: use a number in (0, 1] with up to 4 decimals");
    }
    if (typeof maxScore !== "number" || !/^\d{1,3}(?:\.\d{1,2})?$/.test(String(maxScore)) || maxScore <= 0) {
      throw AppError.badRequest("Invalid criterion maxScore");
    }
    total += Math.round(weight * 10_000);
    return {
      name: requiredText(item.name, "criterion name", 150),
      description: optionalText(item.description, "criterion description", 2000),
      weight: weight.toFixed(4),
      maxScore: maxScore.toFixed(2),
      sortOrder: index + 1,
    };
  });
  if (total !== 10_000) throw AppError.badRequest(`MSG007: Criterion weights must total 100%. Current total: ${total / 100}%.`);
  unique(criteria.map(({ name }) => name), "criterion name");
  return criteria;
}

export function categoryPatch(body: Body): Partial<CategoryInput> {
  const input: Partial<CategoryInput> = {};
  if (body.name !== undefined) input.name = requiredText(body.name, "category name", 100);
  if (body.description !== undefined) input.description = optionalText(body.description, "category description", 2000);
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") throw AppError.badRequest("Invalid isActive");
    input.isActive = body.isActive;
  }
  return input;
}

export function parseCategories(value: unknown): CategoryConfig[] {
  if (value === undefined) return [];
  const sections = list(value, "categories", (body) => ({
    ...categoryPatch(body),
    name: requiredText(body.name, "category name", 100),
    criteria: body.criteria === undefined ? [] : parseCriteria(body.criteria),
  }));
  unique(sections.map(({ name }) => name), "category name");
  return sections;
}
