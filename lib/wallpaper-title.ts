import type { Wallpaper, WallpaperFile } from "@/types/wallpaper";

type WallpaperTitleInput = Pick<Wallpaper, "aiTags" | "tags" | "title"> &
  Partial<
    Pick<Wallpaper, "aiCaption" | "height" | "videoUrl" | "width"> & {
      files: WallpaperFile[];
    }
  >;

const SOURCE_TAGS = new Set([
  "ins",
  "instagram",
  "instagram-post",
  "celebrity",
  "editorial",
  "motion",
  "dynamic",
  "video",
  "live-wallpaper",
  "动态",
]);

const GENERIC_VISUAL_TAGS = new Set([
  "人像",
  "人物",
  "女性",
  "少女",
  "女孩",
  "微笑",
  "自拍",
  "时尚",
  "背景",
  "侧脸",
  "侧颜",
  "长发",
  "portrait",
  "people",
  "person",
  "woman",
  "girl",
  "female",
  "fashion",
  "selfie",
  "smile",
  "wallpaper",
]);

const PERSON_TAGS: Array<{ label: string; tags: string[] }> = [
  { label: "IU", tags: ["iu", "李知恩", "李智恩", "이지은", "아이유"] },
  {
    label: "Jang Wonyoung",
    tags: ["jang-wonyoung", "wonyoung", "张元英", "張員瑛", "장원영"],
  },
  {
    label: "Lim Yoona",
    tags: ["lim-yoona", "yoona", "林允儿", "林潤娥", "임윤아"],
  },
  {
    label: "Irene",
    tags: ["bae-joohyun", "irene", "裴珠泫", "裴柱现", "배주현"],
  },
  {
    label: "Karina",
    tags: ["karina-yu-jimin", "karina", "柳智敏", "刘知珉", "유지민"],
  },
  { label: "Bae Suzy", tags: ["bae-suzy", "suzy", "裴秀智", "배수지"] },
  {
    label: "Kim Jisoo",
    tags: ["kim-jisoo", "jisoo", "金智秀", "김지수"],
  },
  { label: "Liu Yifei", tags: ["liu-yifei", "刘亦菲", "劉亦菲"] },
];

function normalizeTitleToken(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.#_@/\\|()[\]{}:;'"，。、“”‘’·・\-\s]+/g, "");
}

export function looksLikeImportedWallpaperTitle(title: string) {
  const normalizedTitle = title.trim().toLowerCase();

  return (
    /^(beauty|image|img|photo|wallpaper|lumen)[\s_-]*[a-z]*[\s_-]*\d{2,}$/i.test(
      normalizedTitle,
    ) ||
    /^(dsc|img|pxl|mvimg|mmexport|wechatimg)[\s_-]?\d+/i.test(normalizedTitle) ||
    /\b(copy|final|edit|export|upload)\b/i.test(normalizedTitle) ||
    /^精选壁纸(?:\s+\d+)?$/i.test(normalizedTitle) ||
    /^lumen curated(?:\s+\d+)?$/i.test(normalizedTitle) ||
    /^(?:[a-f0-9]{4,12}[\s_-]){3,}[a-f0-9]{4,24}$/i.test(normalizedTitle) ||
    /^\d{5,}(?:[-_\s]+(?:uhd|hd|4k|\d{3,4}|\d{2,3}fps))*$/i.test(
      normalizedTitle,
    ) ||
    /(?:^|[\s_-])(?:uhd|hd|4k|fps)(?:$|[\s_-])/i.test(normalizedTitle) ||
    normalizedTitle === "ins · instagram · celebrity"
  );
}

function getPersonLabel(tags: string[]) {
  const normalizedTags = new Set(tags.map(normalizeTitleToken));

  return (
    PERSON_TAGS.find((person) =>
      person.tags.some((tag) => normalizedTags.has(normalizeTitleToken(tag))),
    )?.label ?? null
  );
}

function isSourceTag(tag: string) {
  return (
    SOURCE_TAGS.has(tag.trim().toLowerCase()) || SOURCE_TAGS.has(tag.trim())
  );
}

function isGenericVisualTag(tag: string) {
  return (
    GENERIC_VISUAL_TAGS.has(tag.trim().toLowerCase()) ||
    GENERIC_VISUAL_TAGS.has(tag.trim())
  );
}

function cleanCaption(caption: string | null | undefined) {
  const cleaned = caption
    ?.replace(/[。.!！]+$/g, "")
    .replace(/^一张(?:展示|描绘)?/g, "")
    .replace(/^这张(?:壁纸|图片)?/g, "")
    .trim();

  if (!cleaned || cleaned.length < 4) {
    return null;
  }

  return cleaned.length > 28 ? `${cleaned.slice(0, 28)}…` : cleaned;
}

function getResolutionLabel(input: WallpaperTitleInput) {
  const width =
    input.width ?? input.files?.find((file) => file.width)?.width ?? null;
  const height =
    input.height ?? input.files?.find((file) => file.height)?.height ?? null;

  if (!width || !height) {
    return "Live Loop";
  }

  const longEdge = Math.max(width, height);
  const orientation = height > width ? "Portrait" : "Landscape";

  if (longEdge >= 3800) {
    return `4K ${orientation}`;
  }

  if (longEdge >= 2500) {
    return `2K ${orientation}`;
  }

  return orientation;
}

function getMeaningfulTags(input: WallpaperTitleInput) {
  return [...input.aiTags, ...input.tags]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => !isSourceTag(tag))
    .filter(
      (tag) =>
        !PERSON_TAGS.some((person) =>
          person.tags.some(
            (personTag) =>
              normalizeTitleToken(personTag) === normalizeTitleToken(tag),
          ),
        ),
    )
    .filter((tag) => !isGenericVisualTag(tag));
}

export function getProfessionalWallpaperTitle(input: WallpaperTitleInput) {
  const tags = [...input.tags, ...input.aiTags].filter(Boolean);
  const personLabel = getPersonLabel(tags);
  const caption = cleanCaption(input.aiCaption);
  const isIns = input.tags.some(
    (tag) => isSourceTag(tag) && tag.toLowerCase().includes("ins"),
  );
  const isMotion =
    Boolean(input.videoUrl) ||
    input.tags.some((tag) =>
      ["motion", "动态", "video", "live-wallpaper"].includes(
        tag.trim().toLowerCase(),
      ),
    );

  if (isIns && personLabel) {
    return `${personLabel} · ${caption ?? "Archive frame"}`;
  }

  if (isMotion || looksLikeImportedWallpaperTitle(input.title)) {
    if (isMotion) {
      return `Motion Loop · ${getResolutionLabel(input)}`;
    }

    if (caption) {
      return caption;
    }
  }

  const titleParts = input.title
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  const looksLikeTagTitle =
    titleParts.length >= 2 &&
    titleParts.every((part) => isGenericVisualTag(part));

  if (looksLikeTagTitle && caption) {
    return caption;
  }

  const meaningfulTags = getMeaningfulTags(input);

  if (looksLikeTagTitle && meaningfulTags.length > 0) {
    return meaningfulTags.slice(0, 2).join(" · ");
  }

  if (looksLikeImportedWallpaperTitle(input.title)) {
    return meaningfulTags.slice(0, 2).join(" · ") || "精选壁纸";
  }

  return input.title;
}
