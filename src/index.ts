import patchErrorBoundary from "@core/debug/patches/patchErrorBoundary";
import initFixes from "@core/fixes";
import { initFetchI18nStrings } from "@core/i18n";
import initSettings from "@core/ui/settings";
import { initVendettaObject } from "@core/vendetta/api";
import { VdPluginManager } from "@core/vendetta/plugins";
import { updateFonts } from "@lib/addons/fonts";
import { initPlugins, updatePlugins } from "@lib/addons/plugins";
import { initThemes } from "@lib/addons/themes";
import { patchCommands } from "@lib/api/commands";
import { patchLogHook } from "@lib/api/debug";
import { injectFluxInterceptor } from "@lib/api/flux";
import { patchJsx } from "@lib/api/react/jsx";
import { logger } from "@lib/utils/logger";
import { patchSettings } from "@ui/settings";
import { initDebugger } from "@lib/api/debug";

import * as lib from "./lib";

export default async () => {
    // Expose the library as early as possible: deferred tasks and plugins
    // may rely on window.bunny being present.
    window.bunny = lib;

    // Only what is required for the first painted frame stays on the
    // critical path. Network/repository/font/debugger work is pushed back.
    await Promise.all([
        initThemes(),
        injectFluxInterceptor(),
        patchSettings(),
        patchLogHook(),
        patchCommands(),
        patchJsx(),
        initVendettaObject(),
        initSettings(),
        initFixes(),
        patchErrorBoundary(),
        updatePlugins(),
        initPlugins(),
    ]).then(
        // Push them all to unloader
        u => u.forEach(f => f && lib.unload.push(f))
    );

    const deferred: Array<() => unknown> = [
        initFetchI18nStrings,
        updateFonts,
        () => VdPluginManager.initPlugins(),
    ];

    // React DevTools is dead weight in a release build.
    if (__DEV__) deferred.push(initDebugger);

    const runDeferred = () => {
        Promise.allSettled(deferred.map(task => task())).then(results => {
            results.forEach(result => {
                if (result.status === "fulfilled" && result.value) {
                    lib.unload.push(result.value as () => void);
                }
            });
        });
    };

    const idle = (globalThis as any).requestIdleCallback;
    if (typeof idle === "function") idle(runDeferred, { timeout: 1500 });
    else setTimeout(runDeferred, 600);

    logger.log("Kettu Turbo is ready!");
};
