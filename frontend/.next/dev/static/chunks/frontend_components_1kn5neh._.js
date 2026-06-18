(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/components/theme/theme-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider,
    "useTheme",
    ()=>useTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const THEME_STORAGE_KEY = "theme";
function getSystemTheme() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(mode) {
    const resolved = mode === "system" ? getSystemTheme() : mode;
    document.documentElement.classList.toggle("dark", resolved === "dark");
}
function ThemeProvider({ children }) {
    _s();
    const [mode, setMode] = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]("system");
    const [hydrated, setHydrated] = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "ThemeProvider.useEffect": ()=>{
            const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
            const initialMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
            setMode(initialMode);
            applyTheme(initialMode);
            setHydrated(true);
            const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
            if (!mql) return;
            const onChange = {
                "ThemeProvider.useEffect.onChange": ()=>{
                    setMode({
                        "ThemeProvider.useEffect.onChange": (current)=>{
                            // If user chose system, update the resolved class when OS theme changes.
                            if (current === "system") applyTheme("system");
                            return current;
                        }
                    }["ThemeProvider.useEffect.onChange"]);
                }
            }["ThemeProvider.useEffect.onChange"];
            // Safari compatibility
            if ("addEventListener" in mql) mql.addEventListener("change", onChange);
            else mql.addListener(onChange);
            return ({
                "ThemeProvider.useEffect": ()=>{
                    if ("removeEventListener" in mql) mql.removeEventListener("change", onChange);
                    else mql.removeListener(onChange);
                }
            })["ThemeProvider.useEffect"];
        }
    }["ThemeProvider.useEffect"], []);
    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "ThemeProvider.useEffect": ()=>{
            if (!hydrated) return;
            window.localStorage.setItem(THEME_STORAGE_KEY, mode);
            applyTheme(mode);
        }
    }["ThemeProvider.useEffect"], [
        mode,
        hydrated
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
        value: {
            mode,
            setMode,
            hydrated
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/components/theme/theme-provider.tsx",
        lineNumber: 63,
        columnNumber: 5
    }, this);
}
_s(ThemeProvider, "5MYmKnSEzfZ5vOAm/PWfFwJcmlw=");
_c = ThemeProvider;
const ThemeContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"](null);
function useTheme() {
    _s1();
    const ctx = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"](ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
_s1(useTheme, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "ThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/shell/theme-transition.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeTransition",
    ()=>ThemeTransition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
function ThemeTransition() {
    _s();
    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "ThemeTransition.useEffect": ()=>{
            const el = document.documentElement;
            el.classList.add("theme-transition");
            return ({
                "ThemeTransition.useEffect": ()=>{
                    el.classList.remove("theme-transition");
                }
            })["ThemeTransition.useEffect"];
        }
    }["ThemeTransition.useEffect"], []);
    return null;
}
_s(ThemeTransition, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = ThemeTransition;
var _c;
__turbopack_context__.k.register(_c, "ThemeTransition");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_components_1kn5neh._.js.map