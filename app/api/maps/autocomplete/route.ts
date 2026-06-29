import { NextResponse } from "next/server";

type AddressSuggestion = {
  label: string;
  placeId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  state?: string;
  countryCode?: string;
};

const COUNTRY_TO_ISO: Record<string, string> = {
  France: "fr",
  Portugal: "pt",
  Spain: "es",
  Germany: "de",
  Italy: "it",
  Belgium: "be",
  Netherlands: "nl",
  Luxembourg: "lu",
  Switzerland: "ch",
  "United Kingdom": "gb",
  Ireland: "ie",
  Austria: "at",
  Denmark: "dk",
  Sweden: "se",
  Norway: "no",
  Finland: "fi",
  Poland: "pl",
  Czechia: "cz",
  "Czech Republic": "cz",
  Slovakia: "sk",
  Slovenia: "si",
  Croatia: "hr",
  Greece: "gr",
  Romania: "ro",
  Bulgaria: "bg",
  Hungary: "hu",
  Estonia: "ee",
  Latvia: "lv",
  Lithuania: "lt",
  Malta: "mt",
  Cyprus: "cy",
  "United States": "us",
  "United States of America": "us",
  USA: "us",
  US: "us",
  Canada: "ca",
  Australia: "au",
  "New Zealand": "nz",
  Brazil: "br",
  Mexico: "mx",
  Japan: "jp",
  India: "in",
};

type NewAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

function getCountryIso(country: string) {
  const trimmed = country.trim();
  if (!trimmed) return "";
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toLowerCase();
  return COUNTRY_TO_ISO[trimmed] || "";
}

function getComponent(
  components: NewAddressComponent[],
  type: string,
  field: "longText" | "shortText" = "longText",
) {
  return components.find((component) => component?.types?.includes(type))?.[field] || "";
}

function normalizePlace(place: any): AddressSuggestion {
  const components: NewAddressComponent[] = Array.isArray(place?.addressComponents) ? place.addressComponents : [];

  const streetNumber = getComponent(components, "street_number");
  const route = getComponent(components, "route");
  const premise = getComponent(components, "premise");
  const subpremise = getComponent(components, "subpremise");
  const city =
    getComponent(components, "locality") ||
    getComponent(components, "postal_town") ||
    getComponent(components, "administrative_area_level_3") ||
    getComponent(components, "administrative_area_level_2");
  const postalCode = getComponent(components, "postal_code");
  const country = getComponent(components, "country");
  const countryCode = getComponent(components, "country", "shortText");
  const state = getComponent(components, "administrative_area_level_1");

  const address = [streetNumber, route].filter(Boolean).join(" ") || [premise, subpremise].filter(Boolean).join(" ") || place?.displayName?.text || place?.formattedAddress || "";

  return {
    label: place?.formattedAddress || [address, postalCode, city, country].filter(Boolean).join(", "),
    address,
    city,
    postalCode,
    country,
    countryCode,
    state,
    placeId: typeof place?.id === "string" ? place.id : undefined,
  };
}

function getLanguageCode(countryIso: string) {
  const languageByCountry: Record<string, string> = {
    fr: "fr",
    pt: "pt",
    es: "es",
    de: "de",
    it: "it",
    nl: "nl",
    be: "fr",
    lu: "fr",
    ch: "fr",
    at: "de",
    br: "pt",
    mx: "es",
    jp: "ja",
  };
  return languageByCountry[countryIso] || "en";
}

async function placesAutocomplete(input: string, country: string, key: string, sessionToken: string) {
  const iso = getCountryIso(country);

  const body: Record<string, any> = {
    input,
    languageCode: getLanguageCode(iso),
    sessionToken,
  };

  if (iso) {
    body.includedRegionCodes = [iso];
    body.regionCode = iso.toUpperCase();
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    return { suggestions: [], configured: true, status: "REQUEST_FAILED" };
  }

  const suggestions = Array.isArray(data?.suggestions)
    ? data.suggestions
        .map((item: any) => item?.placePrediction)
        .filter(Boolean)
        .slice(0, 6)
        .map((prediction: any) => ({
          label: prediction?.text?.text || "",
          placeId: prediction?.placeId,
        }))
        .filter((item: AddressSuggestion) => item.label && item.placeId)
    : [];

  return { suggestions, configured: true, status: suggestions.length ? "OK" : "ZERO_RESULTS" };
}

async function placeDetails(placeId: string, key: string, sessionToken: string) {
  const safePlaceId = placeId.replace(/^places\//, "");
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(safePlaceId)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  url.searchParams.set("languageCode", "en");

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "id,formattedAddress,addressComponents,displayName",
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) return null;
  return normalizePlace(data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId")?.trim() || "";
  const input = searchParams.get("input")?.trim() || searchParams.get("q")?.trim() || "";
  const country = searchParams.get("country")?.trim() || "";
  const sessionToken = searchParams.get("sessionToken")?.trim() || "";
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim() || "";

  if (!key) {
    return NextResponse.json({ suggestions: [], address: null, configured: false });
  }

  try {
    if (placeId) {
      const address = await placeDetails(placeId, key, sessionToken);
      return NextResponse.json({ address, configured: true }, { status: address ? 200 : 404 });
    }

    if (input.length < 3) {
      return NextResponse.json({ suggestions: [], configured: true });
    }

    const result = await placesAutocomplete(input, country, key, sessionToken);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ suggestions: [], address: null, configured: Boolean(key) });
  }
}
