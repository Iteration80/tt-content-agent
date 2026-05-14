type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type RawPhotos = Record<string, string | string[]>;
type IntakeJson = Record<string, unknown>;

interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  TT_CONTENT_AGENT_TRIGGER_TOKEN?: string;
}

interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

interface ScheduledControllerLike {
  cron?: string;
  scheduledTime?: number;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: unknown;
}

interface R2Bucket {
  get(key: string): Promise<unknown>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: unknown): Promise<unknown>;
}

interface SubmittedRow {
  sku: string;
  category: Category;
  intake_json: string;
  raw_photos: string;
  image_flags: string | null;
}

interface ParsedItem {
  sku: string;
  category: Category;
  config: CategoryConfig;
  intake: IntakeJson;
  rawPhotos: RawPhotos;
  imageFlags: unknown;
}

interface GeneratedPayload {
  processedPhotos: RawPhotos;
  agentOutput: AgentOutput;
  agentFlags: string[];
  photoAnalysis: PhotoAnalysis;
}

interface PhotoAnalysis {
  presentSlots: string[];
  missingRecommendedSlots: string[];
  legacySlots: string[];
  generatedOutputSlots: string[];
  photoCount: number;
  primarySlot: string | null;
  qaConfidence: number;
  flags: string[];
  reviewLabel: "photo-qa-pass" | "photo-qa-review";
  internalSummary: string;
}

interface PrimaryImageSelection {
  url: string;
  slot: string | null;
}

interface AgentOutput {
  vendoo_form: {
    title: string;
    description: string;
    brand: string;
    condition: Condition;
    primary_color: Color;
    secondary_color: Color | null;
    sku: string;
    zip_code: "91405";
    tags: string[];
    quantity: 1;
    category: Category;
    us_size: string;
    package_weight_oz: number;
    package_dims_in: PackageDims;
    listing_price_cents: number;
    cost_of_goods_cents: number;
    vendoo_labels: string[];
    internal_notes: string;
  };
  platform_specific: {
    depop: {
      hashtags: string[];
      style_tags: string[];
      source_tag: SourceTag;
      age_tag: Exclude<Era, "unknown">;
      colors: Color[];
    };
    poshmark: {
      brand_picker_match: string | null;
      category_path: string;
      style_tags: string[];
      colors: Color[];
      condition: "NWT" | "Like New" | "Good" | "Fair";
    };
  };
  media: {
    primary_image_url: string;
    image_urls: string[];
  };
  agent_metadata: {
    agent_version: string;
    model: string;
    confidence: Record<string, number>;
    flags: string[];
    generated_at: string;
  };
}

interface CategoryConfig {
  noun: string;
  hero: string;
  poshmarkCategoryPath: string;
  defaultStyleTags: string[];
  packageWeightOz: number;
  packageDimsIn: PackageDims;
}

interface PackageDims {
  length: number;
  width: number;
  height: number;
}

type Category =
  | "ACCESSORIES"
  | "BAG"
  | "COAT"
  | "DRESS"
  | "HATS"
  | "JACKET"
  | "JUMPSUIT"
  | "PANTS"
  | "PURSE"
  | "SEPARATES"
  | "SHIRT"
  | "SHOES"
  | "SKIRT"
  | "SPORTSWEAR"
  | "SUIT"
  | "SWEATER";

type Condition = "like_new" | "excellent" | "good" | "fair";
type SourceTag = "vintage" | "secondhand" | "thrift" | "deadstock";
type Era = "2000s" | "90s" | "80s" | "70s" | "60s" | "pre-60s" | "unknown";
type Color =
  | "Black"
  | "White"
  | "Ivory"
  | "Beige"
  | "Brown"
  | "Tan"
  | "Gray"
  | "Silver"
  | "Gold"
  | "Red"
  | "Pink"
  | "Orange"
  | "Yellow"
  | "Green"
  | "Blue"
  | "Navy"
  | "Purple"
  | "Multicolor";

const IMAGE_PREFIX = "https://images.threadandtime.com/";
const AGENT_VERSION = "worker-photo-qa-v1";
const MODEL = "deterministic-photo-qa";

const RECOMMENDED_PHOTO_SLOTS = [
  "detail",
  "flat_lay",
  "hanger",
  "on_model_back",
  "on_model_front",
  "on_model_hero",
  "tag_label",
];

const LEGACY_SLOT_ALIASES: Record<string, string> = {
  hero_on_model: "on_model_hero",
};

const GENERATED_OUTPUT_RAW_SLOTS = new Set(["ghost_mannequin", "hero_clean_bg", "hero_brand_bg", "lifestyle"]);

const PHOTO_SLOT_LABELS: Record<string, string> = {
  damage: "Damage",
  detail: "Detail",
  flat_lay: "Flat Lay",
  hanger: "Hanger",
  on_model_back: "On-Model Back",
  on_model_front: "On-Model Front",
  on_model_hero: "On-Model Hero",
  tag_label: "Tag-Label",
};

const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  ACCESSORIES: {
    noun: "Accessory",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Accessories",
    defaultStyleTags: ["minimalist", "classic"],
    packageWeightOz: 4,
    packageDimsIn: { length: 8, width: 6, height: 1 },
  },
  BAG: {
    noun: "Bag",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Bags",
    defaultStyleTags: ["classic", "everyday"],
    packageWeightOz: 16,
    packageDimsIn: { length: 12, width: 10, height: 4 },
  },
  COAT: {
    noun: "Coat",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Jackets & Coats > Coats",
    defaultStyleTags: ["outerwear", "classic"],
    packageWeightOz: 32,
    packageDimsIn: { length: 18, width: 14, height: 5 },
  },
  DRESS: {
    noun: "Dress",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Dresses > Midi",
    defaultStyleTags: ["vintage", "classic", "everyday"],
    packageWeightOz: 12,
    packageDimsIn: { length: 14, width: 10, height: 2 },
  },
  HATS: {
    noun: "Hat",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Accessories > Hats",
    defaultStyleTags: ["classic", "statement"],
    packageWeightOz: 8,
    packageDimsIn: { length: 10, width: 8, height: 4 },
  },
  JACKET: {
    noun: "Jacket",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Jackets & Coats > Jackets",
    defaultStyleTags: ["outerwear", "classic"],
    packageWeightOz: 20,
    packageDimsIn: { length: 16, width: 12, height: 4 },
  },
  JUMPSUIT: {
    noun: "Jumpsuit",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Dresses > Jumpsuits & Rompers",
    defaultStyleTags: ["statement", "everyday"],
    packageWeightOz: 16,
    packageDimsIn: { length: 14, width: 10, height: 3 },
  },
  PANTS: {
    noun: "Pants",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Pants & Jumpsuits > Pants",
    defaultStyleTags: ["classic", "everyday"],
    packageWeightOz: 14,
    packageDimsIn: { length: 14, width: 10, height: 2 },
  },
  PURSE: {
    noun: "Purse",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Bags > Shoulder Bags",
    defaultStyleTags: ["classic", "statement"],
    packageWeightOz: 16,
    packageDimsIn: { length: 12, width: 10, height: 4 },
  },
  SEPARATES: {
    noun: "Set",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Matching Sets",
    defaultStyleTags: ["coordinated", "classic"],
    packageWeightOz: 18,
    packageDimsIn: { length: 14, width: 10, height: 3 },
  },
  SHIRT: {
    noun: "Top",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Tops",
    defaultStyleTags: ["classic", "everyday"],
    packageWeightOz: 8,
    packageDimsIn: { length: 12, width: 10, height: 1 },
  },
  SHOES: {
    noun: "Shoes",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Shoes",
    defaultStyleTags: ["classic", "everyday"],
    packageWeightOz: 32,
    packageDimsIn: { length: 13, width: 8, height: 5 },
  },
  SKIRT: {
    noun: "Skirt",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Skirts",
    defaultStyleTags: ["vintage", "minimalist"],
    packageWeightOz: 8,
    packageDimsIn: { length: 12, width: 10, height: 1 },
  },
  SPORTSWEAR: {
    noun: "Sportswear",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Other",
    defaultStyleTags: ["athletic", "everyday"],
    packageWeightOz: 12,
    packageDimsIn: { length: 14, width: 10, height: 2 },
  },
  SUIT: {
    noun: "Suit",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Suits & Blazers",
    defaultStyleTags: ["tailored", "classic"],
    packageWeightOz: 24,
    packageDimsIn: { length: 16, width: 12, height: 4 },
  },
  SWEATER: {
    noun: "Sweater",
    hero: "on_model_hero",
    poshmarkCategoryPath: "Women > Sweaters",
    defaultStyleTags: ["cozy", "classic"],
    packageWeightOz: 16,
    packageDimsIn: { length: 14, width: 10, height: 3 },
  },
};

const CONDITIONS = new Set<Condition>(["like_new", "excellent", "good", "fair"]);
const SOURCE_TAGS = new Set<SourceTag>(["vintage", "secondhand", "thrift", "deadstock"]);
const ERAS = new Set<Era>(["2000s", "90s", "80s", "70s", "60s", "pre-60s", "unknown"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, db: await pingDb(env) });
    }

    if (request.method === "POST" && url.pathname === "/process") {
      const auth = requireTriggerAuth(request, env);
      if (!auth.ok) return auth.response;

      let sku: string | undefined;
      try {
        const body = await readOptionalJson(request);
        sku = typeof body?.sku === "string" ? body.sku : undefined;
      } catch {
        return err(400, "invalid JSON body");
      }

      try {
        return json(await processOne(env, sku));
      } catch (error) {
        return err(500, "content agent failed", {
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return err(404, "not found");
  },

  async scheduled(_event: ScheduledControllerLike, env: Env, ctx: ExecutionContextLike): Promise<void> {
    ctx.waitUntil(
      processOne(env).then((result) => {
        if (result.processed) {
          console.log(`Processed ${result.sku}`);
        }
      })
    );
  },
};

async function processOne(env: Env, targetSku?: string): Promise<Record<string, JsonValue>> {
  const now = new Date().toISOString();
  const row = await claimSubmittedItem(env, now, targetSku);
  if (!row) {
    return { ok: true, processed: false, status: "idle", sku: targetSku ?? null };
  }

  try {
    const item = parseItem(row);
    const generated = buildAgentPayload(item, now);
    await commitProcessed(env, item, generated, now);
    return {
      ok: true,
      processed: true,
      sku: item.sku,
      status: "needs_approval",
      agent_version: AGENT_VERSION,
      flags: generated.agentFlags,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markFailed(env, row.sku, message, now);
    throw error;
  }
}

async function claimSubmittedItem(env: Env, now: string, targetSku?: string): Promise<SubmittedRow | null> {
  const baseSelect =
    "sku, category, intake_json, raw_photos, image_flags";

  if (targetSku) {
    return env.DB
      .prepare(
        `UPDATE items
         SET status = 'processing', updated_at = ?1, error = NULL
         WHERE sku = ?2 AND status = 'submitted'
         RETURNING ${baseSelect}`
      )
      .bind(now, targetSku)
      .first<SubmittedRow>();
  }

  return env.DB
    .prepare(
      `UPDATE items
       SET status = 'processing', updated_at = ?1, error = NULL
       WHERE sku = (
         SELECT sku FROM items
         WHERE status = 'submitted'
         ORDER BY updated_at ASC
         LIMIT 1
       )
       AND status = 'submitted'
       RETURNING ${baseSelect}`
    )
    .bind(now)
    .first<SubmittedRow>();
}

function parseItem(row: SubmittedRow): ParsedItem {
  assertCategory(row.category);
  const intake = parseJson<IntakeJson>(row.intake_json, "intake_json");
  const rawPhotos = parseJson<RawPhotos>(row.raw_photos, "raw_photos");
  const config = CATEGORY_CONFIG[row.category];

  if (!isPlainObject(intake)) throw new Error("intake_json must be an object");
  if (!isRawPhotos(rawPhotos)) throw new Error("raw_photos must be a non-empty R2 URL map");

  return {
    sku: row.sku,
    category: row.category,
    config,
    intake,
    rawPhotos,
    imageFlags: parseOptionalJson(row.image_flags, "image_flags"),
  };
}

function buildAgentPayload(item: ParsedItem, now: string): GeneratedPayload {
  const { sku, category, config, intake, rawPhotos } = item;
  const brand = cleanText(intake.brand, "Unbranded", 100);
  const itemName = cleanText(intake.item_name, config.noun, 120);
  const sizeLabel = cleanText(intake.size_label, "One Size", 20);
  const material = cleanText(intake.material_primary, "", 100);
  const condition = toCondition(intake.condition);
  const sourceTag = toSourceTag(intake.source_tag);
  const ageTag = toAgeTag(intake.era_guess);
  const colors = inferColors([brand, itemName, material, intake.damage_notes, intake.item_story].join(" "));
  const styleTags = buildStyleTags(intake.style_tags, config.defaultStyleTags, sourceTag);
  const vendooTags = unique([...styleTags, sourceTag, normalizeTag(category), normalizeTag(config.noun)])
    .filter(Boolean)
    .slice(0, 20);
  const processedPhotos = copyRawPhotos(rawPhotos);
  const imageUrls = flattenPhotoUrls(processedPhotos);
  const primaryImage = pickPrimaryImage(processedPhotos, config.hero, imageUrls);

  if (!primaryImage) throw new Error("processed_photos produced no media URLs");

  const photoAnalysis = analyzePhotoSet(rawPhotos, primaryImage.slot, intake);
  const agentFlags = buildAgentFlags(intake, item.imageFlags, photoAnalysis);
  const title =
    typeof intake.manual_title_override === "string" && intake.manual_title_override.trim()
      ? truncate(intake.manual_title_override, 80)
      : buildTitle({ brand, ageTag, color: colors[0], material, itemName, sizeLabel });

  const agentOutput: AgentOutput = {
    vendoo_form: {
      title,
      description: buildDescription({ brand, itemName, config, condition, material, sizeLabel, intake }),
      brand,
      condition,
      primary_color: colors[0],
      secondary_color: colors[1] ?? null,
      sku,
      zip_code: "91405",
      tags: vendooTags,
      quantity: 1,
      category,
      us_size: sizeLabel,
      package_weight_oz: config.packageWeightOz,
      package_dims_in: config.packageDimsIn,
      listing_price_cents: nonnegativeInt(intake.price_target_cents),
      cost_of_goods_cents: nonnegativeInt(intake.purchase_price_cents),
      vendoo_labels: ["content-agent-photo-qa", photoAnalysis.reviewLabel, "needs-human-qa"],
      internal_notes:
        `Photo QA: ${photoAnalysis.internalSummary} Uploaded photos are reused as processed photos; no Nano Banana or AI listing call has run yet.`,
    },
    platform_specific: {
      depop: {
        hashtags: buildDepopHashtags({ brand, noun: config.noun, sourceTag, ageTag, category }),
        style_tags: styleTags,
        source_tag: sourceTag,
        age_tag: ageTag,
        colors,
      },
      poshmark: {
        brand_picker_match: brand === "Unbranded" ? null : brand,
        category_path: config.poshmarkCategoryPath,
        style_tags: styleTags,
        colors,
        condition: poshmarkCondition(condition),
      },
    },
    media: {
      primary_image_url: primaryImage.url,
      image_urls: imageUrls.slice(0, 24),
    },
    agent_metadata: {
      agent_version: AGENT_VERSION,
      model: MODEL,
      confidence: {
        title: 0.7,
        description: 0.68,
        brand: brand === "Unbranded" ? 0.4 : 0.82,
        price: 0.86,
        category_mapping: 0.9,
        photo_processing: photoAnalysis.qaConfidence,
      },
      flags: agentFlags,
      generated_at: now,
    },
  };

  assertAgentOutputShape(agentOutput);

  return {
    processedPhotos,
    agentOutput,
    agentFlags,
    photoAnalysis,
  };
}

async function commitProcessed(
  env: Env,
  item: ParsedItem,
  generated: GeneratedPayload,
  now: string
): Promise<void> {
  const detail: Record<string, JsonValue> = {
    photo_qa_worker: true,
    agent_version: AGENT_VERSION,
    model: MODEL,
    processed_photo_slots: Object.keys(generated.processedPhotos),
    flags: generated.agentFlags,
    photo_qa: toJsonValue({
      photo_count: generated.photoAnalysis.photoCount,
      present_slots: generated.photoAnalysis.presentSlots,
      missing_recommended_slots: generated.photoAnalysis.missingRecommendedSlots,
      primary_slot: generated.photoAnalysis.primarySlot,
      legacy_slots: generated.photoAnalysis.legacySlots,
      generated_output_raw_slots: generated.photoAnalysis.generatedOutputSlots,
      confidence: generated.photoAnalysis.qaConfidence,
      review_label: generated.photoAnalysis.reviewLabel,
    }),
  };
  if (item.imageFlags) detail.reprocess_image_flags = toJsonValue(item.imageFlags);

  await env.DB.batch([
    env.DB
      .prepare(
        `UPDATE items
         SET status = 'needs_approval',
             processed_photos = ?1,
             agent_output = ?2,
             agent_flags = ?3,
             image_flags = NULL,
             error = NULL,
             updated_at = ?4
         WHERE sku = ?5 AND status = 'processing'`
      )
      .bind(
        JSON.stringify(generated.processedPhotos),
        JSON.stringify(generated.agentOutput),
        JSON.stringify(generated.agentFlags),
        now,
        item.sku
      ),
    env.DB
      .prepare(
        `INSERT INTO audit_log (sku, at, actor, event, detail)
         VALUES (?1, ?2, 'content-agent', 'processed', ?3)`
      )
      .bind(item.sku, now, JSON.stringify(detail)),
  ]);
}

async function markFailed(env: Env, sku: string, message: string, now: string): Promise<void> {
  await env.DB.batch([
    env.DB
      .prepare(
        `UPDATE items
         SET status = 'failed', error = ?1, updated_at = ?2
         WHERE sku = ?3 AND status = 'processing'`
      )
      .bind(message, now, sku),
    env.DB
      .prepare(
        `INSERT INTO audit_log (sku, at, actor, event, detail)
         VALUES (?1, ?2, 'content-agent', 'failed', ?3)`
      )
      .bind(sku, now, JSON.stringify({ error: message, agent_version: AGENT_VERSION })),
  ]);
}

async function pingDb(env: Env): Promise<Record<string, JsonValue>> {
  try {
    const r = await env.DB.prepare("SELECT 1 AS one").first<{ one: number }>();
    return { ok: r?.one === 1, detail: r ? "select-1 ok" : "no row" };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

function requireTriggerAuth(
  request: Request,
  env: Env
): { ok: true } | { ok: false; response: Response } {
  const configured = env.TT_CONTENT_AGENT_TRIGGER_TOKEN;
  if (!configured) {
    return {
      ok: false,
      response: err(503, "trigger token not configured"),
    };
  }

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  const header = request.headers.get("x-tt-content-agent-token");
  if (bearer === configured || header === configured) return { ok: true };

  return { ok: false, response: err(401, "unauthorized") };
}

async function readOptionalJson(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (!text.trim()) return null;
  const parsed = JSON.parse(text) as unknown;
  if (parsed === null) return null;
  if (!isPlainObject(parsed)) throw new Error("body must be an object");
  return parsed;
}

function copyRawPhotos(rawPhotos: RawPhotos): RawPhotos {
  return Object.fromEntries(
    Object.entries(rawPhotos).map(([slot, value]) => [slot, Array.isArray(value) ? [...value] : value])
  );
}

function flattenPhotoUrls(photos: RawPhotos): string[] {
  return Object.values(photos)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((url) => typeof url === "string" && url.startsWith(IMAGE_PREFIX));
}

function pickPrimaryImage(
  photos: RawPhotos,
  heroSlot: string,
  imageUrls: string[]
): PrimaryImageSelection | undefined {
  const preferredSlots = [
    heroSlot,
    "on_model_hero",
    "on_model_front",
    "set_front",
    "hero_both_pieces",
    "hero_on_model",
    "front",
    "flat_lay",
    "pair_side",
    "full_flat",
    "ghost_mannequin",
  ];
  for (const slot of unique(preferredSlots)) {
    const photo = firstPhoto(photos[slot]);
    if (photo) return { url: photo, slot };
  }
  return imageUrls[0] ? { url: imageUrls[0], slot: null } : undefined;
}

function firstPhoto(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function analyzePhotoSet(rawPhotos: RawPhotos, primarySlot: string | null, intake: IntakeJson): PhotoAnalysis {
  const presentSlots = photoSlots(rawPhotos);
  const missingRecommendedSlots = RECOMMENDED_PHOTO_SLOTS.filter((slot) => !presentSlots.includes(slot));
  const legacySlots = Object.keys(rawPhotos)
    .filter((slot) => LEGACY_SLOT_ALIASES[slot])
    .sort();
  const generatedOutputSlots = Object.keys(rawPhotos)
    .filter((slot) => GENERATED_OUTPUT_RAW_SLOTS.has(slot))
    .sort();
  const photoCount = countPhotoUrls(rawPhotos);
  const canonicalPrimarySlot = primarySlot ? canonicalSlot(primarySlot) : null;
  const flags: string[] = [];

  if (missingRecommendedSlots.length === 0) {
    flags.push("photo_qa_recommended_slots_complete");
  } else {
    for (const slot of missingRecommendedSlots) {
      flags.push(`photo_qa_missing_${slot}`);
    }
  }

  if (!hasPhotoSlot(rawPhotos, "on_model_hero") && !hasPhotoSlot(rawPhotos, "on_model_front")) {
    flags.push("photo_qa_missing_front_view");
  }
  if (photoCount < 4) flags.push("photo_qa_thin_photo_set");
  if (hasText(intake.damage_notes) && !hasPhotoSlot(rawPhotos, "damage")) {
    flags.push("photo_qa_damage_notes_without_damage_photo");
  }
  if (hasPhotoSlot(rawPhotos, "damage") && !hasText(intake.damage_notes)) {
    flags.push("photo_qa_damage_photo_without_damage_notes");
  }
  for (const slot of legacySlots) {
    flags.push(`photo_qa_legacy_slot_${slot}`);
  }
  for (const slot of generatedOutputSlots) {
    flags.push(`photo_qa_raw_contains_generated_output_${slot}`);
  }
  if (canonicalPrimarySlot === "on_model_hero") {
    flags.push("photo_qa_primary_on_model_hero");
  } else if (canonicalPrimarySlot) {
    flags.push(`photo_qa_primary_fallback_${canonicalPrimarySlot}`);
  } else {
    flags.push("photo_qa_primary_fallback_first_upload");
  }

  const reviewLabel = flags.some((flag) => {
    return (
      flag.startsWith("photo_qa_missing_") ||
      flag.includes("_without_") ||
      flag.includes("raw_contains_generated_output") ||
      flag === "photo_qa_thin_photo_set"
    );
  })
    ? "photo-qa-review"
    : "photo-qa-pass";
  const qaConfidence = photoQaConfidence({
    presentSlots,
    missingRecommendedSlots,
    generatedOutputSlots,
    photoCount,
    rawPhotos,
    intake,
  });

  const internalSummary = [
    `${photoCount} uploaded photo${photoCount === 1 ? "" : "s"} across ${formatSlotList(presentSlots)}.`,
    `Missing recommended slots: ${formatSlotList(missingRecommendedSlots)}.`,
    `Primary slot: ${canonicalPrimarySlot ? humanSlot(canonicalPrimarySlot) : "first uploaded image"}.`,
  ].join(" ");

  return {
    presentSlots,
    missingRecommendedSlots,
    legacySlots,
    generatedOutputSlots,
    photoCount,
    primarySlot: canonicalPrimarySlot,
    qaConfidence,
    flags: unique(flags),
    reviewLabel,
    internalSummary,
  };
}

function canonicalSlot(slot: string): string {
  return LEGACY_SLOT_ALIASES[slot] ?? slot;
}

function photoSlots(rawPhotos: RawPhotos): string[] {
  return unique(Object.keys(rawPhotos).map((slot) => canonicalSlot(slot))).sort();
}

function countPhotoUrls(photos: RawPhotos): number {
  return Object.values(photos).reduce((count, value) => {
    return count + (Array.isArray(value) ? value.length : 1);
  }, 0);
}

function hasPhotoSlot(rawPhotos: RawPhotos, slot: string): boolean {
  return Object.keys(rawPhotos).some((rawSlot) => canonicalSlot(rawSlot) === slot);
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function photoQaConfidence({
  presentSlots,
  missingRecommendedSlots,
  generatedOutputSlots,
  photoCount,
  rawPhotos,
  intake,
}: {
  presentSlots: string[];
  missingRecommendedSlots: string[];
  generatedOutputSlots: string[];
  photoCount: number;
  rawPhotos: RawPhotos;
  intake: IntakeJson;
}): number {
  const presentRecommendedCount = RECOMMENDED_PHOTO_SLOTS.length - missingRecommendedSlots.length;
  let score = 0.35 + (presentRecommendedCount / RECOMMENDED_PHOTO_SLOTS.length) * 0.45;

  if (presentSlots.includes("on_model_hero")) score += 0.08;
  else if (presentSlots.includes("on_model_front")) score += 0.04;
  if (presentSlots.includes("tag_label")) score += 0.04;
  if (hasText(intake.damage_notes) === hasPhotoSlot(rawPhotos, "damage")) score += 0.03;
  if (photoCount < 4) score -= 0.08;
  score -= generatedOutputSlots.length * 0.05;

  return Number(Math.min(0.95, Math.max(0.2, score)).toFixed(2));
}

function formatSlotList(slots: string[]): string {
  return slots.length ? slots.map(humanSlot).join(", ") : "none";
}

function humanSlot(slot: string): string {
  return PHOTO_SLOT_LABELS[slot] ?? titleCase(slot.replace(/_/g, " "));
}

function buildTitle({
  brand,
  ageTag,
  color,
  material,
  itemName,
  sizeLabel,
}: {
  brand: string;
  ageTag: string;
  color: string;
  material: string;
  itemName: string;
  sizeLabel: string;
}): string {
  return truncate(
    [brand, ageTag, color, titleCase(material), itemName, `Size ${sizeLabel}`].filter(Boolean).join(" "),
    80
  );
}

function buildDescription({
  brand,
  itemName,
  config,
  condition,
  material,
  sizeLabel,
  intake,
}: {
  brand: string;
  itemName: string;
  config: CategoryConfig;
  condition: Condition;
  material: string;
  sizeLabel: string;
  intake: IntakeJson;
}): string {
  const sentences = [
    `${brand} ${itemName} ${config.noun.toLowerCase()} in ${humanCondition(condition)} condition.`,
    `Tagged size ${sizeLabel}${material ? ` with ${material.toLowerCase()} as the primary material` : ""}.`,
  ];

  if (intake.flat_measurements) {
    sentences.push(cleanSentence(`Measurements: ${intake.flat_measurements}`));
  }
  if (intake.damage_notes) {
    sentences.push(cleanSentence(`Condition note: ${intake.damage_notes}`));
  }
  if (intake.item_story) {
    sentences.push(cleanSentence(intake.item_story));
  }

  return truncate(sentences.join(" "), 500);
}

function buildStyleTags(rawStyleTags: unknown, defaults: string[], sourceTag: string): string[] {
  const tags = Array.isArray(rawStyleTags) ? rawStyleTags : [];
  return unique([...tags, ...defaults, sourceTag])
    .map((tag) => cleanText(tag, "", 30).toLowerCase())
    .filter(Boolean)
    .slice(0, 3);
}

function buildDepopHashtags({
  brand,
  noun,
  sourceTag,
  ageTag,
  category,
}: {
  brand: string;
  noun: string;
  sourceTag: SourceTag;
  ageTag: string;
  category: string;
}): string[] {
  const candidates = [
    normalizeTag(brand),
    normalizeTag(noun),
    normalizeTag(sourceTag),
    normalizeTag(ageTag),
    normalizeTag(category),
    "threadandtime",
    "secondhandstyle",
  ];
  const hashtags = unique(candidates).filter(Boolean).slice(0, 5);
  while (hashtags.length < 5) {
    hashtags.push(`threadtime${hashtags.length + 1}`);
  }
  return hashtags.map((tag) => tag.slice(0, 30));
}

function buildAgentFlags(intake: IntakeJson, imageFlags: unknown, photoAnalysis: PhotoAnalysis): string[] {
  const flags = ["worker_photo_qa_v1", "processed_photos_reuse_raw_uploads", ...photoAnalysis.flags];
  if (!intake.era_guess || intake.era_guess === "unknown") flags.push("era_defaulted_to_2000s");
  if (!Array.isArray(intake.style_tags) || intake.style_tags.length === 0) flags.push("style_tags_defaulted");
  if (!intake.source_tag) flags.push("source_tag_defaulted");
  if (!intake.flat_measurements) flags.push("measurements_missing");
  if (intake.damage_notes) flags.push("condition_notes_present");
  if (imageFlags) flags.push("reprocess_flags_acknowledged");
  return flags;
}

function inferColors(text: string): Color[] {
  const haystack = text.toLowerCase();
  const matches: Color[] = [];
  const add = (needle: string, color: Color) => {
    if (haystack.includes(needle) && !matches.includes(color)) matches.push(color);
  };

  add("black", "Black");
  add("white", "White");
  add("ivory", "Ivory");
  add("cream", "Ivory");
  add("beige", "Beige");
  add("brown", "Brown");
  add("tan", "Tan");
  add("gray", "Gray");
  add("grey", "Gray");
  add("smoke", "Gray");
  add("silver", "Silver");
  add("gold", "Gold");
  add("red", "Red");
  add("pink", "Pink");
  add("orange", "Orange");
  add("yellow", "Yellow");
  add("green", "Green");
  add("navy", "Navy");
  add("blue", "Blue");
  add("purple", "Purple");
  add("floral", "Multicolor");
  add("multi", "Multicolor");

  if (matches.length === 0) matches.push("Black");
  return matches.slice(0, 2);
}

function toCondition(value: unknown): Condition {
  return typeof value === "string" && CONDITIONS.has(value as Condition) ? (value as Condition) : "good";
}

function toSourceTag(value: unknown): SourceTag {
  return typeof value === "string" && SOURCE_TAGS.has(value as SourceTag) ? (value as SourceTag) : "secondhand";
}

function toAgeTag(value: unknown): Exclude<Era, "unknown"> {
  if (typeof value === "string" && ERAS.has(value as Era) && value !== "unknown") {
    return value as Exclude<Era, "unknown">;
  }
  return "2000s";
}

function poshmarkCondition(condition: Condition): "Like New" | "Good" | "Fair" {
  if (condition === "like_new") return "Like New";
  if (condition === "fair") return "Fair";
  return "Good";
}

function nonnegativeInt(value: unknown): number {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function humanCondition(condition: string): string {
  return condition.replace(/_/g, " ");
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return truncate(text || fallback, maxLength);
}

function cleanSentence(value: unknown): string {
  const text = cleanText(value, "", 500);
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeTag(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 30);
}

function truncate(value: unknown, maxLength: number): string {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd();
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))];
}

function assertAgentOutputShape(output: AgentOutput): void {
  assert(output.vendoo_form.title.length > 0 && output.vendoo_form.title.length <= 80, "title must be 1-80 chars");
  assert(
    output.vendoo_form.description.length > 0 && output.vendoo_form.description.length <= 500,
    "description must be 1-500 chars"
  );
  assert(output.vendoo_form.zip_code === "91405", "zip_code must be 91405");
  assert(output.vendoo_form.quantity === 1, "quantity must be 1");
  assert(output.platform_specific.depop.hashtags.length === 5, "Depop requires exactly 5 hashtags");
  assert(output.media.primary_image_url.startsWith(IMAGE_PREFIX), "primary_image_url must be an R2 public URL");
  assert(output.media.image_urls.length > 0 && output.media.image_urls.length <= 24, "media.image_urls must be 1-24 URLs");
  assert(output.agent_metadata.generated_at.includes("T"), "generated_at must be ISO-like");
}

function assertCategory(value: string): asserts value is Category {
  if (!(value in CATEGORY_CONFIG)) throw new Error(`Unsupported category: ${value}`);
}

function isRawPhotos(value: unknown): value is RawPhotos {
  if (!isPlainObject(value) || Object.keys(value).length === 0) return false;
  return Object.values(value).every((entry) => {
    if (typeof entry === "string") return entry.startsWith(IMAGE_PREFIX);
    return Array.isArray(entry) && entry.length > 0 && entry.every((url) => typeof url === "string" && url.startsWith(IMAGE_PREFIX));
  });
}

function parseJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(`Could not parse ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseOptionalJson(value: string | null, label: string): unknown {
  if (value === null || value === "") return null;
  return parseJson<unknown>(value, label);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

function err(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ ok: false, error: message, ...extra }, { status });
}
