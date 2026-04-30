import { expect, test } from "@playwright/test";

test.describe("多语言 API", () => {
  test("未指定 locale 时默认返回英文", async ({ request }) => {
    const response = await request.get("/api/i18n", {
      headers: {
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.headers()["content-language"]).toBe("en");

    const payload = (await response.json()) as {
      data: {
        locale: string;
        messages: {
          home: {
            navExplore: string;
          };
        };
      };
    };

    expect(payload.data.locale).toBe("en");
    expect(payload.data.messages.home.navExplore).toBe("Explore");
  });

  test("i18n 字典支持英语、日语、韩语", async ({ request }) => {
    for (const locale of ["en", "ja", "ko"] as const) {
      const response = await request.get(`/api/i18n?locale=${locale}`);

      expect(response.ok()).toBe(true);
      expect(response.headers()["content-language"]).toBe(locale);

      const payload = (await response.json()) as {
        data: {
          locale: string;
          messages: {
            common: {
              language: string;
            };
            home: {
              navExplore: string;
            };
          };
          supportedLocales: Array<{ locale: string }>;
        };
      };

      expect(payload.data.locale).toBe(locale);
      expect(payload.data.messages.common.language.length).toBeGreaterThan(0);
      expect(payload.data.messages.home.navExplore.length).toBeGreaterThan(0);
      expect(payload.data.supportedLocales.map((item) => item.locale)).toEqual(
        expect.arrayContaining(["zh-CN", "en", "ja", "ko"]),
      );
    }
  });

  test("公开数据接口按 locale 返回本地化标签", async ({ request }) => {
    const [facetsResponse, presetsResponse, homeResponse] = await Promise.all([
      request.get("/api/wallpapers/facets?locale=en"),
      request.get("/api/wallpapers/download-presets?locale=ja"),
      request.get("/api/home?locale=ko"),
    ]);

    expect(facetsResponse.ok()).toBe(true);
    expect(presetsResponse.ok()).toBe(true);
    expect(homeResponse.ok()).toBe(true);

    const facets = (await facetsResponse.json()) as {
      data: {
        filters: {
          media: Array<{ label: string; value: string }>;
        };
      };
    };
    const presets = (await presetsResponse.json()) as {
      data: {
        groups: Array<{
          presets: Array<{ id: string; label: string }>;
        }>;
      };
    };
    const home = (await homeResponse.json()) as {
      data: {
        locale: string;
      };
    };

    expect(
      facets.data.filters.media.find((item) => item.value === "all")?.label,
    ).toBe("All");
    expect(
      presets.data.groups
        .flatMap((group) => group.presets)
        .find((preset) => preset.id === "ipad-portrait")?.label,
    ).toBe("iPad 縦向き");
    expect(home.data.locale).toBe("ko");
  });
});
