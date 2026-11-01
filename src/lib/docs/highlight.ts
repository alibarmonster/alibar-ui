import { createHighlighter, type Highlighter, type ThemeRegistration } from "shiki";

/** A quiet light theme tuned to the site palette. */
const theme: ThemeRegistration = {
  name: "alibar-light",
  type: "light",
  colors: { "editor.background": "#ffffff", "editor.foreground": "#3f3f46" },
  tokenColors: [
    { settings: { foreground: "#3f3f46" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#71717a", fontStyle: "italic" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator", "meta.jsx.children"], settings: { foreground: "#71717a" } },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression", "variable.language"],
      settings: { foreground: "#be185d" },
    },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#15803d" } },
    { scope: ["constant.numeric", "constant.language", "constant.character", "support.constant"], settings: { foreground: "#b45309" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#7c3aed" } },
    { scope: ["entity.name.tag", "support.class.component", "entity.name.tag.tsx"], settings: { foreground: "#2563eb" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#0e7490" } },
    { scope: ["entity.name.type", "support.type", "entity.name.class", "support.class", "entity.other.inherited-class"], settings: { foreground: "#0e7490" } },
    { scope: ["variable.parameter", "variable.other.readwrite", "variable.other.object"], settings: { foreground: "#3f3f46" } },
    { scope: ["meta.object-literal.key", "variable.other.property", "support.type.property-name"], settings: { foreground: "#3f3f46" } },
    { scope: ["source.css support.type.property-name", "support.type.property-name.css"], settings: { foreground: "#0e7490" } },
    { scope: ["source.css variable", "variable.css", "variable.argument.css"], settings: { foreground: "#7c3aed" } },
    { scope: ["source.shell entity.name.command", "support.function.builtin.shell"], settings: { foreground: "#7c3aed" } },
  ],
};

export type CodeLanguage = "tsx" | "ts" | "bash" | "css" | "json";

let highlighter: Promise<Highlighter> | undefined;

export async function highlight(code: string, lang: CodeLanguage = "tsx") {
  highlighter ??= createHighlighter({ themes: [theme], langs: ["tsx", "ts", "bash", "css", "json"] });
  return (await highlighter).codeToHtml(code.trimEnd(), { lang, theme: "alibar-light" });
}
