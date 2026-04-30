import type {
  CategoryData,
  DarkroomItem,
  EditorialFeature,
  EditorialItem,
  FilmCellData,
  FooterColumn,
  HeroStat,
  MoodCardData,
  NavLink,
  TickerItem,
} from "@/types/home";
import { getLocalizedHomeDataCopy } from "@/lib/i18n-ui";
import type { SupportedLocale } from "@/types/i18n";

export const navLinks: NavLink[] = [
  { label: "探索", href: "/explore" },
  { label: "暗室精选", href: "/darkroom" },
  { label: "创作者", href: "/creator/studio" },
  { label: "4K 库", href: "/explore" },
];

export function getLocalizedNavLinks(locale: SupportedLocale): NavLink[] {
  const copy = getLocalizedHomeDataCopy(locale);

  return [
    { label: copy.nav.explore, href: "/explore" },
    { label: copy.nav.darkroom, href: "/darkroom" },
    { label: copy.nav.creator, href: "/creator/studio" },
    { label: copy.nav.library, href: "/explore" },
  ];
}

export const footerColumns: FooterColumn[] = [
  {
    title: "探索",
    links: [
      { label: "情绪版", href: "/explore" },
      { label: "暗室精选", href: "/darkroom" },
      { label: "热门排行", href: "/explore" },
      { label: "随机发现", href: "/explore" },
    ],
  },
  {
    title: "创作者",
    links: [
      { label: "上传作品", href: "/creator/studio" },
      { label: "收益计划", href: "/creator/studio" },
      { label: "版权保护", href: "/creator/studio" },
      { label: "创作者指南", href: "/creator/studio" },
    ],
  },
  {
    title: "关于",
    links: [
      { label: "关于 Lumen", href: "/explore" },
      { label: "隐私政策", href: "/explore" },
      { label: "使用条款", href: "/explore" },
      { label: "联系我们", href: "/explore" },
    ],
  },
];

export function getLocalizedFooterColumns(
  locale: SupportedLocale,
): FooterColumn[] {
  const copy = getLocalizedHomeDataCopy(locale);

  return [
    {
      title: copy.footerColumns.explore,
      links: [
        { label: copy.footerLinks.mood, href: "/explore" },
        { label: copy.footerLinks.darkroom, href: "/darkroom" },
        { label: copy.footerLinks.popular, href: "/explore" },
        { label: copy.footerLinks.random, href: "/explore" },
      ],
    },
    {
      title: copy.footerColumns.creator,
      links: [
        { label: copy.footerLinks.upload, href: "/creator/studio" },
        { label: copy.footerLinks.revenue, href: "/creator/studio" },
        { label: copy.footerLinks.copyright, href: "/creator/studio" },
        { label: copy.footerLinks.guide, href: "/creator/studio" },
      ],
    },
    {
      title: copy.footerColumns.about,
      links: [
        { label: copy.footerLinks.about, href: "/explore" },
        { label: copy.footerLinks.privacy, href: "/explore" },
        { label: copy.footerLinks.terms, href: "/explore" },
        { label: copy.footerLinks.contact, href: "/explore" },
      ],
    },
  ];
}

export const heroStats: HeroStat[] = [
  { value: "48K+", label: "精选壁纸" },
  { value: "2.1M", label: "月活用户" },
  { value: "3,200", label: "创作者" },
];

export function getLocalizedHeroStats(locale: SupportedLocale): HeroStat[] {
  const copy = getLocalizedHomeDataCopy(locale);

  return [
    { value: "48K+", label: copy.stats.wallpapers },
    { value: "2.1M", label: copy.stats.monthlyUsers },
    { value: "3,200", label: copy.stats.creators },
  ];
}

export const heroFilmRows: FilmCellData[][] = [
  [
    {
      gradient: "void",
      href: "/wallpaper/void-001",
      label: "宇宙 · 027",
      previewUrl: "/api/wallpapers/void-001/fallback?variant=preview",
    },
    {
      gradient: "dusk",
      href: "/wallpaper/dusk-003",
      label: "黄昏 · 041",
      previewUrl: "/api/wallpapers/dusk-003/fallback?variant=preview",
    },
    {
      gradient: "forest",
      href: "/wallpaper/forest-002",
      label: "自然 · 013",
      previewUrl: "/api/wallpapers/forest-002/fallback?variant=preview",
    },
  ],
  [
    {
      gradient: "ocean",
      href: "/wallpaper/ocean-006",
      label: "深海 · 058",
      previewUrl: "/api/wallpapers/ocean-006/fallback?variant=preview",
    },
    {
      gradient: "lava",
      href: "/wallpaper/lava-004",
      label: "熔岩 · 072",
      previewUrl: "/api/wallpapers/lava-004/fallback?variant=preview",
    },
    {
      gradient: "night",
      href: "/wallpaper/night-008",
      label: "暗夜 · 089",
      previewUrl: "/api/wallpapers/night-008/fallback?variant=preview",
    },
  ],
  [
    {
      gradient: "blush",
      href: "/wallpaper/blush-007",
      label: "腮红 · 104",
      previewUrl: "/api/wallpapers/blush-007/fallback?variant=preview",
    },
    {
      gradient: "ice",
      href: "/wallpaper/ice-005",
      label: "冰川 · 117",
      previewUrl: "/api/wallpapers/ice-005/fallback?variant=preview",
    },
    {
      gradient: "ember",
      href: "/wallpaper/ember-009",
      label: "余烬 · 132",
      previewUrl: "/api/wallpapers/ember-009/fallback?variant=preview",
    },
  ],
];

export const tickerItems: TickerItem[] = [
  { text: "最新上传" },
  { text: "4K 超清", tone: "gold" },
  { text: "自然风光" },
  { text: "本周热榜", tone: "red" },
  { text: "极简主义" },
  { text: "AI 生成艺术", tone: "gold" },
  { text: "宇宙星系" },
  { text: "赛博朋克", tone: "red" },
  { text: "摄影师作品" },
  { text: "暗色系", tone: "gold" },
];

export function getLocalizedTickerItems(locale: SupportedLocale): TickerItem[] {
  const copy = getLocalizedHomeDataCopy(locale);

  return [
    { text: copy.ticker.latest },
    { text: copy.ticker.k4, tone: "gold" },
    { text: copy.ticker.nature },
    { text: copy.ticker.trending, tone: "red" },
    { text: copy.ticker.minimal },
    { text: copy.ticker.ai, tone: "gold" },
    { text: copy.ticker.space },
    { text: copy.ticker.cyberpunk, tone: "red" },
    { text: copy.ticker.photographer },
    { text: copy.ticker.dark, tone: "gold" },
  ];
}

export const moodCards: MoodCardData[] = [
  {
    id: "void-001",
    gradient: "void",
    shape: "portrait",
    number: "001",
    name: "深夜独处",
    meta: "宇宙 · 4K",
    href: "/wallpaper/void-001",
  },
  {
    id: "forest-002",
    gradient: "forest",
    shape: "landscape",
    number: "002",
    name: "清晨翠谷",
    meta: "自然 · 5K",
    href: "/wallpaper/forest-002",
  },
  {
    id: "dusk-003",
    gradient: "dusk",
    shape: "tall",
    number: "003",
    name: "黄昏将至",
    meta: "渐变 · 4K",
    href: "/wallpaper/dusk-003",
  },
  {
    id: "lava-004",
    gradient: "lava",
    shape: "square",
    number: "004",
    name: "烈焰熔岩",
    meta: "抽象 · 4K",
    href: "/wallpaper/lava-004",
  },
  {
    id: "ice-005",
    gradient: "ice",
    shape: "portrait",
    number: "005",
    name: "极地寒流",
    meta: "自然 · 4K",
    href: "/wallpaper/ice-005",
  },
  {
    id: "ocean-006",
    gradient: "ocean",
    shape: "landscape",
    number: "006",
    name: "深海蔚蓝",
    meta: "自然 · 5K",
    href: "/wallpaper/ocean-006",
  },
  {
    id: "blush-007",
    gradient: "blush",
    shape: "square",
    number: "007",
    name: "粉色心境",
    meta: "极简 · 2K",
    href: "/wallpaper/blush-007",
  },
  {
    id: "night-008",
    gradient: "night",
    shape: "tall",
    number: "008",
    name: "午夜城市",
    meta: "城市 · 4K",
    href: "/wallpaper/night-008",
  },
  {
    id: "ember-009",
    gradient: "ember",
    shape: "portrait",
    number: "009",
    name: "炭火余烬",
    meta: "暗色 · 4K",
    href: "/wallpaper/ember-009",
  },
  {
    id: "moss-010",
    gradient: "moss",
    shape: "landscape",
    number: "010",
    name: "苔藓之境",
    meta: "自然 · 4K",
    href: "/wallpaper/moss-010",
  },
];

export const editorialFeature: EditorialFeature = {
  gradient: "forest",
  eyebrow: "编辑推荐 · 本周",
  title: "消失于翡翠山谷的晨雾",
  description:
    "摄影师 Lin Yue 在四川盆地花了三天守候这一帧，光、雾与绿在这里达成了一次短暂和解。",
  href: "/wallpaper/forest-featured",
};

export const editorialItems: EditorialItem[] = [
  {
    gradient: "void",
    number: "NO.02",
    title: "星云漂移",
    meta: "宇宙 · 5K · 1,240 次下载",
    href: "/wallpaper/void-001",
  },
  {
    gradient: "lava",
    number: "NO.03",
    title: "地核之火",
    meta: "抽象 · 4K · 987 次下载",
    href: "/wallpaper/lava-004",
  },
  {
    gradient: "night",
    number: "NO.04",
    title: "深夜漫游者",
    meta: "城市 · 4K · 876 次下载",
    href: "/wallpaper/night-008",
  },
];

export const categories: CategoryData[] = [
  {
    gradient: "forest",
    label: "自然风光",
    count: "8.4K",
    href: "/explore/nature",
  },
  {
    gradient: "void",
    label: "宇宙星系",
    count: "5.1K",
    href: "/explore/space",
  },
  {
    gradient: "dusk",
    label: "抽象艺术",
    count: "12K",
    href: "/explore/abstract",
  },
  {
    gradient: "ice",
    label: "极简主义",
    count: "6.2K",
    href: "/explore/minimal",
  },
  {
    gradient: "night",
    label: "城市夜景",
    count: "9.6K",
    href: "/explore/city",
  },
  {
    gradient: "blush",
    label: "插画二次元",
    count: "7.3K",
    href: "/explore/illustration",
  },
  { gradient: "ember", label: "暗色系", count: "4.8K", href: "/explore/dark" },
];

export function getLocalizedCategories(
  locale: SupportedLocale,
): CategoryData[] {
  const copy = getLocalizedHomeDataCopy(locale);
  const categoryLabels = copy.categories as Record<string, string>;

  return categories.map((category) => {
    const key = category.href.split("/").pop() ?? "";

    return {
      ...category,
      label: categoryLabels[key] ?? category.label,
    };
  });
}

export const searchTags = [
  "全部",
  "暗夜",
  "极简",
  "渐变",
  "自然",
  "宇宙",
  "城市",
  "抽象",
  "日系",
  "赛博",
  "AI 生成",
];

export function getLocalizedSearchTags(locale: SupportedLocale) {
  const copy = getLocalizedHomeDataCopy(locale);

  return [
    copy.searchTags.all,
    copy.searchTags.night,
    copy.searchTags.minimal,
    copy.searchTags.gradient,
    copy.searchTags.nature,
    copy.searchTags.space,
    copy.searchTags.city,
    copy.searchTags.abstract,
    copy.searchTags.japanese,
    copy.searchTags.cyber,
    copy.searchTags.ai,
  ];
}

export const darkroomItems: DarkroomItem[] = [
  {
    gradient: "dusk",
    title: "暮色将临，万物静默",
    meta: "渐变 · 5K · 2,341 下载",
    href: "/wallpaper/dusk-003",
    badge: "本周最佳",
    featured: true,
  },
  {
    gradient: "ocean",
    title: "冰川之蓝",
    meta: "自然 · 4K",
    href: "/wallpaper/ocean-006",
  },
  {
    gradient: "ember",
    title: "炭火夜语",
    meta: "暗色 · 4K",
    href: "/wallpaper/ember-009",
  },
  {
    gradient: "moss",
    title: "苔藓与光",
    meta: "自然 · 4K",
    href: "/wallpaper/moss-010",
  },
  {
    gradient: "blush",
    title: "粉樱之间",
    meta: "极简 · 2K",
    href: "/wallpaper/blush-007",
  },
];
