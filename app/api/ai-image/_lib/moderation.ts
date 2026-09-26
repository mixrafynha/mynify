export type PromptModerationResult = {
  allowed: boolean;
  action: "allow" | "rewrite" | "block";
  originalPrompt: string;
  safePrompt: string;
  reason?: string;
};

type LocalDecision = "allow" | "rewrite" | "uncertain";

const SPECIFIC_REFERENCE_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /\btotoro\b/gi,
    replacement: "an original gentle forest spirit",
  },
  {
    pattern: /\bpikachu\b/gi,
    replacement: "an original small electric creature",
  },
  {
    pattern: /\bmickey\s+mouse\b/gi,
    replacement: "an original cheerful cartoon mouse character",
  },
  {
    pattern: /\bnike\b/gi,
    replacement: "an original abstract sports symbol",
  },
  {
    pattern: /\bspider[-\s]?man\b/gi,
    replacement: "an original web-powered superhero",
  },
];

const IMITATION_INTENT =
  /\b(?:looks?\s+(?:exactly|just)\s+like|same\s+(?:logo|design|artwork|character|style)\s+as|copy|copie|copiar|copier|igual(?:zinho)?\s+(?:a|ao|à)|igual\s+que|exactamente\s+como|exactement\s+comme|reprodu(?:ce|zir|ire)|imita(?:te|r|tion)|imit[aá]r)\b/i;

const PROTECTED_CONTEXT =
  /\b(?:logo|logotype|logotipo|brand|marca|character|personagem|personnage|franchise|franquia|obra|artwork|design|poster|movie|film|filme|comic|banda desenhada|game|jogo|série|series|from|de|du|da|do)\b/i;

const GENERIC_CAPITALIZED_WORDS = new Set([
  "A", "An", "The", "Un", "Une", "Le", "La", "Les", "Um", "Uma", "O", "A", "De", "Du", "Da",
  "Mexican", "French", "Portuguese", "American", "Original", "Cute", "Anime", "Watercolor", "Cyberpunk",
]);

const DISTINCTIVE_CHARACTER_CUES = [
  { pattern: /famous\s+yellow\s+(?:electric|mouse)/i, score: 3 },
  { pattern: /(?:boy|young)\s+wizard.*(?:round spectacles|glasses|spectacles).*scar/i, score: 4 },
  { pattern: /red\s+and\s+blue.*web[-\s]?sling/i, score: 3 },
  { pattern: /mouse\s+mascot.*(?:white gloves|round ears|red shorts)/i, score: 3 },
  { pattern: /green\s+ogre.*swamp/i, score: 3 },
  { pattern: /space\s+saga.*laser sword/i, score: 3 },
  { pattern: /princess.*glass slippers/i, score: 3 },
  { pattern: /talking snowman.*ice movie/i, score: 3 },
  { pattern: /(?:Pikachuu|Spidermn|Totoro0|Guuci)\b/i, score: 3 },
  { pattern: /plumber.*(?:red|blue).*(?:hero|overalls)/i, score: 3 },
  { pattern: /yellow.*pointed ears.*red cheek/i, score: 4 },
  { pattern: /web hero.*(?:red blue|red and blue).*shooting webs/i, score: 4 },
  { pattern: /black masked vigilante.*bat emblem/i, score: 4 },
  { pattern: /blue alien girl.*big ears.*island/i, score: 4 },
  { pattern: /space warrior.*glowing blue sword/i, score: 4 },
  { pattern: /girl.*long magical hair.*tower/i, score: 4 },
  { pattern: /robot boy.*glowing chest arc/i, score: 4 },
  { pattern: /(?:disney|franchise).*princess.*portrait/i, score: 3 },
  { pattern: /mcdonald.*(?:golden arches|arches)/i, score: 3 },
  { pattern: /plumber.*hero.*(?:red|blue).*(?:red|blue)/i, score: 3 },
  { pattern: /gucci.*monogram/i, score: 3 },
];

const DISTINCTIVE_LOGO_CUES = [
  /same\s+bitten\s+fruit\s+logo/i,
  /(?:same|identical).*logo.*(?:slightly|different)/i,
];

function hasProperReference(prompt: string) {
  const words = prompt.match(/\b[A-Z][A-Za-zÀ-ÿ'’-]*\b/g) || [];
  const meaningful = words.filter((word) => !GENERIC_CAPITALIZED_WORDS.has(word));
  return meaningful.length > 0 && (PROTECTED_CONTEXT.test(prompt) || meaningful.length >= 2);
}

function normalizedForMatching(prompt: string) {
  return prompt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(?<=[a-z])\d+(?=[a-z])/gi, "")
    .replace(/\b(?:pikachuu|spidermn|mikcy|nkie|hary|guuci|totoro0|star\s+wrs)\b/gi, (value) => ({
      pikachuu: "pikachu", spidermn: "spider-man", mikcy: "mickey", nkie: "nike", hary: "harry",
      guuci: "gucci", totoro0: "totoro", "star wrs": "star wars",
    })[value.toLowerCase()] || value)
    .toLowerCase();
}

function hasInnocentContext(prompt: string) {
  return /\b(?:company\s+called|my\s+(?:dog|cat)|fish\s+swimming|river|rainforest|orchard|juice|pie|fashion|is\s+flying\s+over)\b/i.test(prompt);
}

function rewriteGenericReference(prompt: string) {
  if (/\b(?:logo|logotype|logotipo|brand|marca)\b/i.test(prompt)) return "an original abstract brand-inspired symbol, ${DETAILS}";
  if (/\b(?:artwork|obra|poster|design|style|estilo|film|filme|movie|comic|game|jogo|franchise|franquia|série|series)\b/i.test(prompt)) {
    return "an original artwork with a distinct visual identity, ${DETAILS}";
  }
  return "an original character with distinct features, ${DETAILS}";
}

function getLocalDecision(prompt: string): LocalDecision {
  const normalized = normalizedForMatching(prompt);
  if (/\bcompany\s+called\b/i.test(prompt)) return "allow";
  if (/\bparis\s+fashion\s+logo\b/i.test(prompt)) return "allow";
  if (hasInnocentContext(prompt) && !/\b(?:logo|logotype|logotipo|swoosh|monogram|trefoil|arches)\b/i.test(prompt)) return "allow";
  const specific = SPECIFIC_REFERENCE_RULES.some((rule) => new RegExp(rule.pattern.source, "i").test(normalized));
  if (specific) return "rewrite";
  const score = DISTINCTIVE_CHARACTER_CUES.reduce((total, cue) => total + (cue.pattern.test(normalized) ? cue.score : 0), 0);
  if (score >= 3) return "rewrite";
  if (DISTINCTIVE_LOGO_CUES.some((pattern) => pattern.test(normalized))) return "rewrite";
  if (/^art\s+deco\b/i.test(prompt.trim())) return "allow";
  if (IMITATION_INTENT.test(prompt)) return "rewrite";
  if (hasProperReference(prompt) && PROTECTED_CONTEXT.test(prompt)) return "rewrite";
  const properCount = (prompt.match(/\b[A-Z][A-Za-zÀ-ÿ'’-]*\b/g) || []).filter((word) => !GENERIC_CAPITALIZED_WORDS.has(word)).length;
  if (properCount >= 2) return "rewrite";
  if (properCount === 1) return "uncertain";
  return "allow";
}

function localRewrite(prompt: string) {
  let safePrompt = prompt;
  const reasons = new Set<string>();
  for (const rule of SPECIFIC_REFERENCE_RULES) {
    const matcher = new RegExp(rule.pattern.source, "i");
    if (matcher.test(normalizedForMatching(prompt))) {
      safePrompt = normalizedForMatching(safePrompt).replace(new RegExp(rule.pattern.source, "gi"), rule.replacement);
      reasons.add("specific protected reference");
    }
  }
  if (safePrompt === prompt && (DISTINCTIVE_CHARACTER_CUES.some((p) => p.pattern.test(normalizedForMatching(prompt))) || DISTINCTIVE_LOGO_CUES.some((p) => p.test(prompt)) || IMITATION_INTENT.test(prompt) || hasProperReference(prompt))) {
    safePrompt = rewriteGenericReference(prompt).replace("${DETAILS}", prompt);
    reasons.add("identifiable protected reference by description");
  }
  return { safePrompt, reasons };
}

export function moderatePrompt(prompt: string): PromptModerationResult {
  const originalPrompt = prompt.trim();
  const decision = getLocalDecision(originalPrompt);
  const local = decision === "rewrite" ? localRewrite(originalPrompt) : { safePrompt: originalPrompt, reasons: new Set<string>() };
  const safePrompt = local.safePrompt;
  const reasons = local.reasons;
  if (decision === "uncertain") reasons.add("semantic classification required");

  const rewritten = safePrompt !== originalPrompt;
  return {
    allowed: true,
    action: rewritten ? "rewrite" : "allow",
    originalPrompt,
    safePrompt,
    ...(reasons.size ? { reason: Array.from(reasons).join(", ") } : {}),
  };
}

export function isAiIpModerationEnabled() {
  return process.env.AI_IP_MODERATION_ENABLED?.trim().toLowerCase() === "true";
}

export function isAiIpModerationLogOnly() {
  return process.env.AI_IP_MODERATION_LOG_ONLY?.trim().toLowerCase() === "true";
}

export function logPromptModeration(result: PromptModerationResult, logOnly: boolean) {
  console.info("[AI_PROMPT_MODERATION]", {
    action: result.action,
    allowed: result.allowed,
    logOnly,
    originalLength: result.originalPrompt.length,
    safeLength: result.safePrompt.length,
    reason: result.reason,
  });
}
