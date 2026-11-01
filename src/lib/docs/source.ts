import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import type { DemoVariant, PropDoc, PropsGroup } from "./types";

/** Static analysis of component and demo sources (server and build scripts only). */

export function componentFiles(slug: string) {
  return {
    component: `src/components/ui/${slug}/${slug}.tsx`,
    demo: `src/components/ui/${slug}/demo.tsx`,
    docs: `src/components/ui/${slug}/docs.ts`,
  };
}

export async function readProjectFile(relativePath: string) {
  // Build-time only (all docs pages are static), so keep it out of output file tracing.
  return fs.readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), relativePath), "utf8");
}

function parse(source: string, fileName = "file.tsx") {
  return ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function isExported(node: ts.Node) {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  );
}

function references(text: string, name: string) {
  return new RegExp(`(?<![\\w$])${name.replace(/[$]/g, "\\$")}(?![\\w$])`).test(text);
}

/** "WithLabel" → "With label" */
export function humanize(name: string) {
  const words = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(" ");
  return words.map((w, i) => (i === 0 ? w : w.toLowerCase())).join(" ");
}

/** Documented props from every exported `*Props` interface, read from JSDoc. */
export function extractProps(source: string): PropsGroup[] {
  const sf = parse(source);
  const groups: PropsGroup[] = [];

  for (const node of sf.statements) {
    if (!ts.isInterfaceDeclaration(node) || !isExported(node) || !node.name.text.endsWith("Props")) continue;

    const heritage = node.heritageClauses?.map((h) => h.getText(sf)).join(" ") ?? "";
    const extendsElement = heritage.match(/ComponentProps(?:WithoutRef|WithRef)?<"(\w+)">/)?.[1];
    // e.g. ComponentProps<typeof CheckboxPrimitive.Root> → "Checkbox.Root"
    const primitive = heritage.match(/ComponentProps(?:WithoutRef|WithRef)?<typeof (\w+?)(?:Primitive)?\.(\w+)>/);
    const extendsComponent = primitive ? `${primitive[1]}.${primitive[2]}` : undefined;

    const props: PropDoc[] = node.members.filter(ts.isPropertySignature).map((member) => {
      let description: string | undefined;
      let defaultValue: string | undefined;
      for (const doc of ts.getJSDocCommentsAndTags(member)) {
        if (!ts.isJSDoc(doc)) continue;
        description = ts.getTextOfJSDocComment(doc.comment)?.trim() || description;
        for (const tag of doc.tags ?? []) {
          if (tag.tagName.text === "default") defaultValue = ts.getTextOfJSDocComment(tag.comment)?.trim();
        }
      }
      return {
        name: member.name.getText(sf),
        type: member.type?.getText(sf).replace(/\s+/g, " ") ?? "unknown",
        required: !member.questionToken,
        defaultValue,
        description,
      };
    });

    groups.push({ name: node.name.text, extendsElement, extendsComponent, props });
  }
  return groups;
}

/**
 * Each exported function in demo.tsx is a variant. Its snippet contains the
 * imports and local helpers it references, so it can be pasted on its own.
 */
export function extractDemoVariants(source: string): DemoVariant[] {
  const sf = parse(source, "demo.tsx");
  const imports: { text: string; names: string[] }[] = [];
  const helpers: { text: string; names: string[] }[] = [];
  const variants: { name: string; text: string }[] = [];
  let useClient = false;

  for (const st of sf.statements) {
    if (ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression)) {
      if (st.expression.text === "use client") useClient = true;
    } else if (ts.isImportDeclaration(st)) {
      const names: string[] = [];
      const clause = st.importClause;
      if (clause?.name) names.push(clause.name.text);
      if (clause?.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings)) names.push(clause.namedBindings.name.text);
        else clause.namedBindings.elements.forEach((el) => names.push(el.name.text));
      }
      imports.push({ text: st.getText(sf), names });
    } else if (ts.isFunctionDeclaration(st) && st.name && isExported(st)) {
      variants.push({ name: st.name.text, text: st.getText(sf) });
    } else {
      const names: string[] = [];
      if (ts.isVariableStatement(st)) {
        st.declarationList.declarations.forEach((d) => ts.isIdentifier(d.name) && names.push(d.name.text));
      } else if (
        (ts.isFunctionDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) &&
        st.name
      ) {
        names.push(st.name.text);
      }
      helpers.push({ text: st.getText(sf), names });
    }
  }

  return variants.map((variant) => {
    // Pull in helpers transitively, keeping their original order.
    const used = new Set<number>();
    let body = variant.text;
    let changed = true;
    while (changed) {
      changed = false;
      helpers.forEach((helper, i) => {
        if (!used.has(i) && helper.names.some((n) => references(body, n))) {
          used.add(i);
          body += `\n${helper.text}`;
          changed = true;
        }
      });
    }
    const helperText = helpers.filter((_, i) => used.has(i)).map((h) => h.text);
    const code = [...helperText, variant.text].join("\n\n");
    const importText = imports
      .filter((imp) => imp.names.length === 0 || imp.names.some((n) => references(code, n)))
      .map((imp) => imp.text)
      .join("\n");

    return {
      name: variant.name,
      label: humanize(variant.name),
      code: [useClient ? '"use client";' : null, importText, code].filter(Boolean).join("\n\n") + "\n",
    };
  });
}

export interface SourceDependencies {
  /** npm packages, e.g. ["lucide-react", "motion"]. */
  packages: string[];
  /** Absolute alias imports, e.g. ["@/lib/utils", "@/lib/motion"]. */
  local: string[];
}

const IMPLICIT_PACKAGES = new Set(["react", "react-dom"]);

export function extractDependencies(source: string): SourceDependencies {
  const sf = parse(source);
  const packages = new Set<string>();
  const local = new Set<string>();

  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const spec = st.moduleSpecifier.text;
    if (spec.startsWith("@/") || spec.startsWith(".")) {
      local.add(spec);
      continue;
    }
    const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
    if (!IMPLICIT_PACKAGES.has(pkg)) packages.add(pkg);
  }
  return { packages: [...packages].sort(), local: [...local].sort() };
}

/** Theme tokens beyond the shadcn defaults that a component relies on. */
export const EXTRA_TOKENS = {
  success: { light: "#16a34a", dark: "#22c55e" },
  warning: { light: "#d97706", dark: "#f59e0b" },
} as const;

export type ExtraToken = keyof typeof EXTRA_TOKENS;

export function extractExtraTokens(source: string): ExtraToken[] {
  const found = new Set<ExtraToken>();
  const utility =
    /(?:bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|decoration|divide|caret|accent)-(success|warning)\b/g;
  for (const match of source.matchAll(utility)) found.add(match[1] as ExtraToken);
  for (const match of source.matchAll(/var\(--(success|warning)\)/g)) found.add(match[1] as ExtraToken);
  return [...found].sort();
}
