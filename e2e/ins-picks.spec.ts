import { expect, test } from "@playwright/test";

test.describe("INS Picks 专区", () => {
  test("公开 API 返回人物合集和统一上传入口", async ({ request }) => {
    const response = await request.get("/api/ins-picks");

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      data: {
        collections: Array<{
          count: number;
          href: string;
          label: string;
          requiredTags: string[];
          slug: string;
        }>;
        upload: {
          archiveEndpoint: string;
          collectionsEndpoint: string;
          createEndpoint: string;
          href: string;
          presignEndpoint: string;
          requiredTags: string[];
        };
      };
    };

    expect(payload.data.upload.href).toBe("/creator/studio");
    expect(payload.data.upload.archiveEndpoint).toBe("/api/ins-picks/archives");
    expect(payload.data.upload.collectionsEndpoint).toBe(
      "/api/ins-picks/collections",
    );
    expect(payload.data.upload.createEndpoint).toBe("/api/ins-picks/upload");
    expect(payload.data.upload.presignEndpoint).toBe(
      "/api/ins-picks/upload/presign",
    );
    expect(payload.data.upload.requiredTags).toEqual(
      expect.arrayContaining(["ins", "instagram", "celebrity"]),
    );
    expect(payload.data.collections.map((collection) => collection.slug)).toEqual(
      expect.arrayContaining([
        "iu",
        "lim-yoona",
        "jang-wonyoung",
        "bae-joohyun",
        "karina-yu-jimin",
        "bae-suzy",
        "kim-jisoo",
        "liu-yifei",
      ]),
    );

    for (const collection of payload.data.collections) {
      expect(collection.count).toBeGreaterThanOrEqual(0);
      expect(collection.href).toBe(`/ins/${collection.slug}`);
      expect(collection.requiredTags.length).toBeGreaterThan(0);
    }
  });

  test("公开页面展示合集、上传入口和空态导入说明", async ({ page }) => {
    await page.goto("/ins");

    await expect(
      page.getByRole("heading", { name: /Instagram muse archive/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Jang Wonyoung/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /IU \/ Instagram archive/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lim Yoona/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Karina/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Upload photos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Upload API/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Collections API/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /New person set/i })).toBeVisible();
  });

  test("公开页面支持日语和韩语文案", async ({ page }) => {
    await page.goto("/ins?locale=ja");

    await expect(
      page.getByRole("heading", { name: /Instagram ミューズアーカイブ/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /写真をアップロード/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /人物セットを追加/i })).toBeVisible();
    await expect(page.getByText("IVE / Instagram アーカイブ")).toBeVisible();

    await page.goto("/ins/iu?locale=ko");

    await expect(
      page.getByRole("heading", { level: 1, name: /^IU$/i }),
    ).toBeVisible();
    await expect(page.getByText("IU / Instagram 아카이브")).toBeVisible();
    await expect(page.getByRole("link", { name: /전체 컬렉션/i })).toBeVisible();
  });

  test("人物合集页面可直接打开", async ({ page }) => {
    await page.goto("/ins/iu");

    await expect(
      page.getByRole("heading", { level: 1, name: /^IU$/i }),
    ).toBeVisible();
    await expect(page.getByText("IU / Instagram archive")).toBeVisible();
    await expect(page.getByRole("link", { name: /Upload photos/i })).toHaveAttribute(
      "href",
      "/creator/studio?insCollection=iu",
    );
    await expect(page.getByRole("link", { name: /All collections/i })).toBeVisible();
  });

  test("人物合集不会因为通用 INS 标签串档", async ({ request }) => {
    const response = await request.get("/api/ins-picks?collection=iu");

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      data: {
        wallpapers: Array<{
          files: Array<{ storagePath: string }>;
          tags: string[];
        }>;
      };
    };

    for (const wallpaper of payload.data.wallpapers) {
      const searchable = [
        ...wallpaper.tags,
        ...wallpaper.files.map((file) => file.storagePath),
      ].join(" ");

      expect(searchable).toMatch(/iu|李知恩|originals\/ins-picks\/iu/i);
      expect(searchable).not.toMatch(/bae-joohyun|裴珠泫|irene/i);
    }
  });

  test("专区上传元数据公开，写入接口仍要求登录", async ({ request }) => {
    const metadataResponse = await request.get("/api/ins-picks/upload");

    expect(metadataResponse.ok()).toBe(true);

    const metadataPayload = (await metadataResponse.json()) as {
      data: {
        collections: Array<{ slug: string }>;
        archiveEndpoint: string;
        collectionsEndpoint: string;
        createEndpoint: string;
        presignEndpoint: string;
      };
    };

    expect(metadataPayload.data.archiveEndpoint).toBe("/api/ins-picks/archives");
    expect(metadataPayload.data.collectionsEndpoint).toBe(
      "/api/ins-picks/collections",
    );
    expect(metadataPayload.data.createEndpoint).toBe("/api/ins-picks/upload");
    expect(metadataPayload.data.presignEndpoint).toBe(
      "/api/ins-picks/upload/presign",
    );
    expect(metadataPayload.data.collections.map((collection) => collection.slug)).toEqual(
      expect.arrayContaining(["bae-joohyun", "karina-yu-jimin", "bae-suzy", "kim-jisoo"]),
    );

    const presignResponse = await request.post("/api/ins-picks/upload/presign", {
      data: {
        collection: "karina-yu-jimin",
        fileName: "karina.jpg",
        fileSize: 1024 * 100,
        fileType: "image/jpeg",
      },
    });
    expect(presignResponse.status()).toBe(401);

    const createResponse = await request.post("/api/ins-picks/upload", {
      data: {
        collection: "karina-yu-jimin",
        title: "Karina test",
      },
    });
    expect(createResponse.status()).toBe(401);
  });

  test("自定义合集和打包 API 暴露稳定契约", async ({ request }) => {
    const collectionsResponse = await request.get("/api/ins-picks/collections");

    expect(collectionsResponse.ok()).toBe(true);

    const collectionsPayload = (await collectionsResponse.json()) as {
      data: {
        collections: Array<{ r2Prefix: string; slug: string; source: string }>;
      };
    };

    expect(collectionsPayload.data.collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          r2Prefix: "originals/ins-picks/karina-yu-jimin",
          slug: "karina-yu-jimin",
          source: "static",
        }),
      ]),
    );

    const createCollectionResponse = await request.post(
      "/api/ins-picks/collections",
      {
        data: {
          label: "Test Muse",
          nativeName: "测试人物",
        },
      },
    );
    expect(createCollectionResponse.status()).toBe(401);

    const quoteResponse = await request.get(
      "/api/ins-picks/archives?collection=karina-yu-jimin&quote=true",
    );

    expect(quoteResponse.ok()).toBe(true);

    const quotePayload = (await quoteResponse.json()) as {
      data: {
        collection: { r2Prefix: string; slug: string };
        endpoint: string;
        paymentMode: string;
        selectedCount: number;
      };
    };

    expect(quotePayload.data.endpoint).toBe("/api/ins-picks/archives");
    expect(quotePayload.data.paymentMode).toBe("paid-ready");
    expect(quotePayload.data.collection).toEqual(
      expect.objectContaining({
        r2Prefix: "originals/ins-picks/karina-yu-jimin",
        slug: "karina-yu-jimin",
      }),
    );
    expect(quotePayload.data.selectedCount).toBeGreaterThanOrEqual(0);
  });
});
