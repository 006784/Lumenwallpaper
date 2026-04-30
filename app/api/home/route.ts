import {
  captureServerException,
  createRouteLogger,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getHomePageSnapshot } from "@/lib/home";
import { getLocaleResponseHeaders, getRequestLocale } from "@/lib/i18n";

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/home", request);
  const locale = getRequestLocale(request);

  try {
    logger.start();
    const snapshot = await getHomePageSnapshot(locale);
    logger.done("home.snapshot.loaded", {
      darkroomCount: snapshot.darkroomItems.length,
      editorialCount: snapshot.editorialItems.length,
      iosCount: snapshot.iosWallpapers.length,
      moodCardCount: snapshot.moodCards.length,
      motionRows: snapshot.heroFilmRows.length,
    });

    return jsonSuccess(snapshot, {
      headers: {
        ...getPublicApiCacheHeaders(true),
        ...getLocaleResponseHeaders(locale),
      },
      message: "Home snapshot loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      message: "Failed to load home snapshot.",
      route: "/api/home",
      tags: {
        method: "GET",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to load home snapshot.",
      {
        status: 500,
        code: "HOME_SNAPSHOT_FAILED",
      },
    );
  }
}
