const STATE_REQUIRED_COUNTRIES = new Set([
  "US",
  "CA",
  "AU",
  "BR",
  "IN",
  "MX",
  "JP",
  "AE",
  "CN",
  "AR",
  "CL",
  "CO",
  "ID",
  "MY",
  "PH",
  "ZA",
  "NG",
  "KR",
  "TH",
  "VN",
]);

const STATE_LABELS: Record<string, string> = {
  US: "State",
  CA: "Province",
  AU: "State / Territory",
  JP: "Prefecture",
  AE: "Emirate",
  BR: "State",
  IN: "State / Union Territory",
  MX: "State",
};

function normalizeCountryCode(value: string | null | undefined) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{2}$/.test(code) ? code : "";
}

export function getAddressStateLabel(countryCode: string | null | undefined) {
  const code = normalizeCountryCode(countryCode);
  return STATE_LABELS[code] || "State / Province / Region";
}

export function isStateRequiredForCountry(countryCode: string | null | undefined) {
  return STATE_REQUIRED_COUNTRIES.has(normalizeCountryCode(countryCode));
}

export function normalizeAddressState(input: {
  state?: string | null;
  stateCode?: string | null;
}) {
  const state = typeof input.state === "string" ? input.state.trim() : "";
  const stateCode = typeof input.stateCode === "string" ? input.stateCode.trim().toUpperCase() : "";
  return {
    state: state || "",
    stateCode: stateCode || "",
  };
}
