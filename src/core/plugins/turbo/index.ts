import { defineCorePlugin } from "..";
import { deleteJsxCreate, onJsxCreate } from "@lib/api/react/jsx";
import { logger } from "@lib/utils/logger";
import { AppState, Platform } from "react-native";

type JsxCallback = (Component: any, ret: any) => any;

/**
 * Turbo — built-in performance tweaks.
 *
 * Everything here is intentionally "additive": we only fill in props that the
 * component did not set itself, every tweak is isolated, and a failure in one
 * tweak never prevents the others from starting.
 */
const CFG = {
    tuneLists: true,
    capBlur: true,
    fastImageResize: true,
    gcOnMemoryWarning: true,
    periodicGc: true,
    gcIntervalMs: 120000,
};

const registered: Array<[string, JsxCallback]> = [];
let gcTimer: ReturnType<typeof setInterval> | null = null;
let memorySubscription: any = null;

function jsx(name: string, callback: JsxCallback) {
    try {
        onJsxCreate(name, callback);
        registered.push([name, callback]);
    } catch (e) {
        logger.log("Turbo: failed to register JSX tweak", name, e);
    }
}

function tuneLists() {
    // Discord's feeds are the heaviest lists in the app. Only set sane
    // defaults when the component itself did not ask for something specific.
    const tweak: JsxCallback = (_Component, ret) => {
        try {
            const props = ret?.props;
            if (!props) return ret;

            if (props.initialNumToRender == null) props.initialNumToRender = 5;
            if (props.maxToRenderPerBatch == null) props.maxToRenderPerBatch = 5;
            if (props.windowSize == null) props.windowSize = 7;
            if (props.updateCellsBatchingPeriod == null) props.updateCellsBatchingPeriod = 80;
            if (Platform.OS === "android" && props.removeClippedSubviews == null) {
                props.removeClippedSubviews = true;
            }
        } catch { /* never break rendering */ }
        return ret;
    };

    ["FlatList", "VirtualizedList", "RecyclerListView"].forEach(name => jsx(name, tweak));
}

function capBlur() {
    // Blur compositing is expensive on mid-range phones. Keep the look, cap
    // the cost.
    const tweak: JsxCallback = (_Component, ret) => {
        try {
            const props = ret?.props;
            if (!props || typeof props.blurAmount !== "number") return ret;
            if (props.blurAmount > 8) props.blurAmount = 8;
        } catch { /* never break rendering */ }
        return ret;
    };

    ["BlurView", "ThemedBlurView", "NativeBlurView"].forEach(name => jsx(name, tweak));
}

function fastImageResize() {
    if (Platform.OS !== "android") return;

    // "scale" avoids a full-size bitmap decode before downscaling, which
    // measurably reduces memory spikes while scrolling media-heavy chats.
    const tweak: JsxCallback = (_Component, ret) => {
        try {
            const props = ret?.props;
            if (!props || props.resizeMethod != null) return ret;
            props.resizeMethod = "scale";
        } catch { /* never break rendering */ }
        return ret;
    };

    jsx("Image", tweak);
}

function setupGc() {
    const g: any = globalThis;
    if (typeof g.gc !== "function") return;

    if (CFG.gcOnMemoryWarning) {
        try {
            if (AppState?.addEventListener) {
                memorySubscription = AppState.addEventListener("memoryWarning", () => {
                    try { g.gc(); } catch { /* ignore */ }
                });
            }
        } catch { /* ignore */ }
    }

    if (CFG.periodicGc) {
        gcTimer = setInterval(() => {
            try { g.gc(); } catch { /* ignore */ }
        }, CFG.gcIntervalMs);
    }
}

export const preenabled = true;

export default defineCorePlugin({
    manifest: {
        id: "bunny.turbo",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "Turbo",
            description: "Cold-start, list, blur and memory optimizations",
            authors: [{ name: "happy-g0ose" }],
        },
    },

    start() {
        try { if (CFG.tuneLists) tuneLists(); } catch (e) { logger.log("Turbo: list tweak failed", e); }
        try { if (CFG.capBlur) capBlur(); } catch (e) { logger.log("Turbo: blur tweak failed", e); }
        try { if (CFG.fastImageResize) fastImageResize(); } catch (e) { logger.log("Turbo: image tweak failed", e); }
        try { setupGc(); } catch (e) { logger.log("Turbo: GC setup failed", e); }

        logger.log("Turbo: enabled");
    },

    stop() {
        registered.forEach(([name, callback]) => {
            try { deleteJsxCreate(name, callback); } catch { /* ignore */ }
        });
        registered.length = 0;

        if (gcTimer) { clearInterval(gcTimer); gcTimer = null; }
        if (memorySubscription) {
            try {
                if (typeof memorySubscription.remove === "function") memorySubscription.remove();
                else if (typeof memorySubscription === "function") memorySubscription();
            } catch { /* ignore */ }
            memorySubscription = null;
        }

        logger.log("Turbo: disabled");
    },
});
