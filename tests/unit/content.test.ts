import { describe, expect, it } from "vitest";
import { blankOf, deriveFields, mergeContent, schemaOf } from "@/content/fields";
import { contentRegistry, CONTENT_KEYS } from "@/content/registry";
import { homeContent } from "@/content/pages/home";

describe("conteúdo editável", () => {
  it("todas as páginas do registro validam seus próprios padrões", () => {
    for (const key of CONTENT_KEYS) {
      const defaults = contentRegistry[key].defaults;
      const result = schemaOf(defaults).safeParse(defaults);
      expect(result.success, `padrões de ${key}`).toBe(true);
    }
  });

  it("mescla overrides parciais sem perder campos", () => {
    const merged = mergeContent(homeContent, { hero: { title: "Novo título" }, pains: { items: ["a", "b"] } });
    expect(merged.hero.title).toBe("Novo título");
    expect(merged.hero.subtitle).toBe(homeContent.hero.subtitle);
    expect(merged.pains.items).toEqual(["a", "b"]);
    expect(merged.method.steps).toHaveLength(5);
  });

  it("ignora overrides com tipo errado", () => {
    const merged = mergeContent(homeContent, { hero: { title: 42 }, pains: "x" });
    expect(merged.hero.title).toBe(homeContent.hero.title);
    expect(merged.pains).toEqual(homeContent.pains);
  });

  it("deriva a árvore de campos com rótulos em português", () => {
    const tree = deriveFields(homeContent);
    expect(tree.kind).toBe("group");
    if (tree.kind !== "group") return;
    const hero = tree.fields.hero;
    expect(hero.kind).toBe("group");
    if (hero.kind !== "group") return;
    expect(hero.fields.title.label).toBe("Título");
    expect(hero.fields.subtitle.kind).toBe("textarea");
    const services = tree.fields.services;
    if (services.kind !== "group") return;
    const items = services.fields.items;
    expect(items.kind).toBe("list");
    if (items.kind !== "list") return;
    expect(items.item.kind).toBe("group");
    expect(blankOf(homeContent.services.items[0])).toEqual({ slug: "", title: "", body: "", cta: "", tags: [] });
  });

  it("textos oficiais críticos estão presentes", () => {
    expect(homeContent.hero.title).toBe("Seu negócio não precisa de mais ferramentas. Precisa de clareza.");
    expect(homeContent.finalCta.title).toBe("Qual é o gargalo do seu negócio?");
    expect(homeContent.method.steps.map((s) => s.letter).join("")).toBe("CLARO");
  });
});
