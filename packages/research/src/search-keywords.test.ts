import { describe, expect, it } from "vitest";
import { deriveSearchKeywords } from "./search-keywords";

describe("deriveSearchKeywords", () => {
  it("always leads with the venture's own name words", () => {
    const query = deriveSearchKeywords("Nail Design", "An AI-powered nail art try-on app");
    expect(query.startsWith("nail design")).toBe(true);
  });

  it("adds idea-specific terms the name alone doesn't cover", () => {
    const query = deriveSearchKeywords("Roti", "Local roti ordering and delivery app for South Asian customers in Vancouver");
    expect(query).toContain("roti");
    expect(query).toMatch(/ordering|delivery/);
  });

  it("produces materially different queries for materially different ideas", () => {
    const nail = deriveSearchKeywords("Nail Studio", "AI-powered app for virtual nail try-on and salon booking");
    const roti = deriveSearchKeywords("Roti Express", "Local roti ordering and delivery marketplace for South Asian customers in Vancouver");
    const pets = deriveSearchKeywords("PetMeet", "A local pet marketplace connecting owners and breeders in Coquitlam");
    const invoice = deriveSearchKeywords("InvoicePro", "B2B invoice automation and payment tracking tool for German small businesses");
    const study = deriveSearchKeywords("StudyBuddy", "A student study planner and flashcard app for exam prep in India");

    const queries = [nail, roti, pets, invoice, study];
    // No two of the five should end up identical -- if they did, the
    // extraction collapsed distinct ideas into the same search, which is
    // exactly the "generic across ventures" failure mode this exists to avoid.
    const unique = new Set(queries);
    expect(unique.size).toBe(queries.length);
  });

  it("strips stopwords and generic app-store filler rather than passing them through", () => {
    const query = deriveSearchKeywords("MyApp", "An app that helps users get things done for people who want more");
    expect(query).not.toMatch(/\b(that|helps|users|for|people|who|want|more)\b/);
  });

  it("caps extra terms so the query stays a real search, not the whole idea text", () => {
    const query = deriveSearchKeywords(
      "Widget",
      "A tool for scheduling booking planning tracking managing organizing coordinating monitoring reporting",
      3,
    );
    // "widget" (name) + at most 3 extra terms
    expect(query.split(" ").length).toBeLessThanOrEqual(4);
  });

  it("falls back to just the name's words when the idea text adds nothing new", () => {
    const query = deriveSearchKeywords("Roti App", "roti app");
    expect(query).toBe("roti app");
  });
});
