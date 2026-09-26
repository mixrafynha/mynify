import assert from "node:assert/strict";
import test from "node:test";
import { moderatePrompt } from "./moderation";

type ExpectedAction = "allow" | "rewrite";
type Case = { prompt: string; expected: ExpectedAction; category: string };

const group = (category: string, expected: ExpectedAction, prompts: string[]): Case[] =>
  prompts.map((prompt) => ({ prompt, expected, category }));

const cases: Case[] = [
  ...group("personagens/franchises explícitas", "rewrite", [
    "draw a famous yellow electric mouse", "Harry Potter flying", "Star Wars poster", "Mickey Mouse in a suit", "Pikachu surfing", "Spider-Man on a skateboard", "Totoro with pink flowers", "Disney princess portrait", "Super Mario jumping", "Sailor Moon transformation",
  ]),
  ...group("marcas/logos", "rewrite", [
    "Gucci logo in gold", "Nike swoosh on fire", "Adidas trefoil logo", "Coca-Cola can design", "Apple logo futuristic", "McDonald golden arches", "Chanel logo pattern", "Louis Vuitton monogram", "Jordan brand logo", "IKEA logo poster",
  ]),
  ...group("copy/imitation intent", "rewrite", [
    "looks exactly like Batman", "same logo as X", "copy the famous mouse character", "make it identical to the Coca-Cola design", "reproduce the Star Wars poster", "imitate the Nike logo", "copier le logo de la marque", "copiar o design do filme", "igualzinho ao personagem famoso", "exactement comme Harry Potter",
  ]),
  ...group("evasões sem nome", "rewrite", [
    "red and blue web-slinging superhero", "same bitten fruit logo but slightly different", "the famous yellow electric mouse", "boy wizard with round glasses and lightning scar", "the mouse mascot with red shorts", "the plumber hero in red and blue", "the dark knight from Gotham", "the space saga with a laser sword", "the princess with glass slippers", "the talking snowman from the ice movie",
  ]),
  ...group("descrições distintivas", "rewrite", [
    "yellow creature with pointed ears and red cheek circles", "young wizard boy with round spectacles and forehead scar", "web hero in red blue suit shooting webs", "black masked vigilante with bat emblem", "blue alien girl with big ears from an island", "mouse mascot with white gloves and round ears", "space warrior wielding a glowing blue sword", "green ogre living in a swamp", "girl with long magical hair from a tower", "robot boy with a glowing chest arc",
  ]),
  ...group("conceitos genéricos", "allow", [
    "cute dragon", "cat astronaut", "sports logo generic", "superhero generic", "yellow electric mouse", "cute forest creature", "abstract bitten fruit icon", "red blue web-slinging creature", "wizard with glasses", "company logo with a star",
  ]),
  ...group("estilos genéricos", "allow", [
    "anime style forest", "watercolor cat astronaut", "cyberpunk city", "Mexican sugar skull", "retro cartoon robot", "Art Deco poster", "impressionist landscape", "pixel art dragon", "minimal geometric logo", "streetwear graffiti lettering",
  ]),
  ...group("nomes próprios inocentes", "allow", [
    "Harry is flying over Paris", "Jordan wearing sneakers", "Paris fashion logo", "Alice reading a book", "Michael running in the park", "Star is shining over the lake", "Gucci is my dog", "Mickey is a common nickname", "Amazon rainforest landscape", "Apple orchard at sunrise",
  ]),
  ...group("contexto inocente de palavras/marcas", "allow", [
    "logo for my company called Star Wars Plumbing", "I drink apple juice", "orange fruit still life", "jordan river landscape", "nike fish swimming", "gucci the cat portrait", "amazon rainforest watercolor", "apple pie recipe illustration", "chanel of the river at sunset", "target practice bullseye illustration",
  ]),
  ...group("EN / FR / PT", "rewrite", [
    "logo Nike futuriste", "affiche Star Wars en aquarelle", "copier le personnage de Mickey", "personnage comme Harry Potter", "logo igual ao da Apple", "copiar o logotipo da Nike", "reproduzir personagem famoso", "imitar o poster de Star Wars", "mesmo logotipo que a Gucci", "personagem idêntico ao Homem-Aranha",
  ]),
  ...group("typos", "rewrite", [
    "Pikachuu surfing", "Spidermn swinging", "Mikcy Mouse portrait", "Nkie logo flames", "Hary Potter flying", "Star Wrs poster", "Totoro0 forest spirit", "Niké logo moderne", "Guuci monogram", "copyr le logo Nike",
  ]),
  ...group("prompts curtos/longos", "rewrite", [
    "Nike", "Pikachu", "copy Batman", "same logo Nike", `${"x".repeat(700)} Nike logo`, `Harry Potter ${"flying over a city with dramatic clouds and golden light ".repeat(12)}`, "logo Gucci", "Totoro", "Spider-Man", "copy this",
  ]),
];

test("adversarial prompt moderation corpus", () => {
  const failures: Array<{ prompt: string; expected: ExpectedAction; actual: string; category: string }> = [];
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const item of cases) {
    const actual = moderatePrompt(item.prompt).action;
    if (actual !== item.expected) {
      failures.push({ prompt: item.prompt, expected: item.expected, actual, category: item.category });
      if (item.expected === "allow") falsePositives += 1;
      else falseNegatives += 1;
    }
  }

  const passed = cases.length - failures.length;
  console.log(JSON.stringify({
    TOTAL_TESTS: cases.length,
    PASSED: passed,
    FAILED: failures.length,
    FALSE_POSITIVES: falsePositives,
    FALSE_NEGATIVES: falseNegatives,
    ACCURACY: `${((passed / cases.length) * 100).toFixed(2)}%`,
    FAILURES: failures,
  }, null, 2));

  assert.deepEqual(failures, [], "Adversarial moderation failures detected");
});

test("adversarial corpus is deterministic across repeated executions", () => {
  for (const item of cases) {
    const first = JSON.stringify(moderatePrompt(item.prompt));
    for (let attempt = 0; attempt < 100; attempt += 1) {
      assert.equal(JSON.stringify(moderatePrompt(item.prompt)), first, item.prompt);
    }
  }
});
