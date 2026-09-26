import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { moderatePrompt } from "./moderation";

test("allows ordinary creative prompts unchanged", () => {
  for (const prompt of [
    "cute dragon flying over mountains",
    "anime style forest",
    "watercolor cat astronaut",
    "retro cartoon robot",
  ]) {
    const result = moderatePrompt(prompt);
    assert.equal(result.action, "allow", prompt);
    assert.equal(result.safePrompt, prompt);
    assert.equal(result.allowed, true);
  }
});

test("rewrites specific protected references while preserving the concept", () => {
  const cases = [
    ["Totoro with pink flowers", "original gentle forest spirit", "pink flowers"],
    ["Pikachu surfing", "original small electric creature", "surfing"],
    ["Mickey Mouse astronaut", "original cheerful cartoon mouse character", "astronaut"],
    ["Nike logo with flames", "original abstract sports symbol", "flames"],
    ["Spider-Man on a skateboard", "original web-powered superhero", "skateboard"],
  ];

  for (const [prompt, expectedSubject, preservedDetail] of cases) {
    const result = moderatePrompt(prompt);
    assert.equal(result.action, "rewrite", prompt);
    assert.match(result.safePrompt, new RegExp(expectedSubject));
    assert.match(result.safePrompt, new RegExp(preservedDetail));
    assert.equal(result.allowed, true);
  }
});

test("does not rewrite generic edge-case descriptions", () => {
  for (const prompt of [
    "yellow electric mouse",
    "cute forest spirit",
    "superhero with spider powers",
    "sports swoosh logo",
  ]) {
    const result = moderatePrompt(prompt);
    assert.equal(result.action, "allow", prompt);
    assert.equal(result.safePrompt, prompt);
  }
});

test("detects new named entities without adding a name blacklist", () => {
  for (const prompt of ["Gucci logo in gold", "Harry Potter flying", "Star Wars poster"] ) {
    assert.equal(moderatePrompt(prompt).action, "rewrite", prompt);
  }
});

test("detects explicit imitation and evasion wording", () => {
  for (const prompt of [
    "looks exactly like the famous wizard boy",
    "same logo as the sports brand",
    "copy this princess character from the movie",
    "copier le logo de la marque célèbre",
    "copiar o design da personagem famosa",
  ]) {
    assert.equal(moderatePrompt(prompt).action, "rewrite", prompt);
  }
});

test("allows generic concepts in English, French, and Portuguese", () => {
  for (const prompt of [
    "Mexican sugar skull",
    "cute forest creature",
    "dragon astronaut",
    "créature de forêt mignonne",
    "chat astronaute aquarelle",
    "criatura fofa da floresta",
    "logotipo esportivo abstrato",
  ]) {
    assert.equal(moderatePrompt(prompt).action, "allow", prompt);
  }
});

test("rewrites distinctive protected descriptions locally", () => {
  for (const prompt of [
    "famous yellow electric mouse",
    "boy wizard with round glasses and a lightning scar",
    "red and blue web-slinging superhero",
    "mouse mascot with white gloves and round ears",
    "green ogre living in a swamp",
    "same bitten fruit logo but slightly different",
    "Pikachuu surfing",
    "Spidermn swinging",
    "Totoro0 forest spirit",
    "Guuci monogram",
  ]) assert.equal(moderatePrompt(prompt).action, "rewrite", prompt);
});

test("integration keeps moderation before buildQualityPrompt and generation intact", () => {
  const source = readFileSync("app/api/ai-image/_lib/replicate.ts", "utf8");
  const moderationSource = readFileSync("app/api/ai-image/_lib/moderation.ts", "utf8");
  assert.ok(source.indexOf("moderatePrompt") < source.indexOf("buildQualityPrompt(prompt)"));
  assert.match(moderationSource, /AI_IP_MODERATION_ENABLED/);
  assert.match(moderationSource, /AI_IP_MODERATION_LOG_ONLY/);
  assert.match(source, /fallback: \"original-prompt\"/);
});
