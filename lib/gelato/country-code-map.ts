const ISO_COUNTRY_CODES = new Set(
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  ),
);

export const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  france: "FR",
  portugal: "PT",
  spain: "ES",
  germany: "DE",
  italy: "IT",
  belgium: "BE",
  netherlands: "NL",
  luxembourg: "LU",
  austria: "AT",
  switzerland: "CH",
  ireland: "IE",
  poland: "PL",
  czechia: "CZ",
  "czech republic": "CZ",
  denmark: "DK",
  sweden: "SE",
  norway: "NO",
  finland: "FI",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  canada: "CA",
  australia: "AU",
  "new zealand": "NZ",
  brazil: "BR",
  mexico: "MX",
  japan: "JP",
  "south korea": "KR",
  korea: "KR",
  singapore: "SG",
};

function normalizeCountryName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function warnUnresolvedCountry(value: unknown): void {
  if (value === null || value === undefined || value === "") return;

  console.warn({
    event: "gelato_country_code_unresolved",
    value,
  });
}

export function resolveCountryCode(value: unknown): string | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return (
      resolveCountryCode(record.countryCode) ??
      resolveCountryCode(record.country_code) ??
      resolveCountryCode(record.isoCode) ??
      resolveCountryCode(record.country)
    );
  }

  if (typeof value !== "string") {
    warnUnresolvedCountry(value);
    return null;
  }

  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && ISO_COUNTRY_CODES.has(upper)) {
    return upper;
  }

  const mapped = COUNTRY_NAME_TO_ISO[normalizeCountryName(trimmed)];
  if (mapped && ISO_COUNTRY_CODES.has(mapped)) {
    return mapped;
  }

  warnUnresolvedCountry(value);
  return null;
}
