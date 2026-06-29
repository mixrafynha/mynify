export type Step = "shipping" | "review" | "payment";

export type CartVariant = {
  id?: string | null;
  variant_id?: string | null;
  image?: string | null;
  image_url?: string | null;
  sku?: string | null;
  product_color_id?: string | null;
  color?: string | null;
  color_name?: string | null;
  name?: string | null;
  color_hex?: string | null;
  hex?: string | null;
  size?: string | null;
  title?: string | null;
  stock?: number | string | null;
  price?: number | string | null;
  final_price?: number | string | null;
  base_price?: number | string | null;
  product_color?: {
    id?: string | null;
    color?: string | null;
    color_name?: string | null;
    name?: string | null;
    title?: string | null;
    color_hex?: string | null;
    hex?: string | null;
    image?: string | null;
    image_url?: string | null;
  } | null;
  product_colors?: {
    id?: string | null;
    color?: string | null;
    color_name?: string | null;
    name?: string | null;
    title?: string | null;
    color_hex?: string | null;
    hex?: string | null;
    image?: string | null;
    image_url?: string | null;
  } | null;
};

export type CartItem = {
  id: string;
  product_id: string;
  base_product_id?: string | null;
  user_product_id?: string | null;
  baseProductId?: string | null;
  userProductId?: string | null;
  title: string;
  price: number;
  quantity: number;
  variant_id?: string | null;
  color?: string | null;
  size?: string | null;
  image?: string | null;
  stock?: number | null;
  sku?: string | null;
  product_color_id?: string | null;
  variants?: CartVariant[];
  available_variants?: CartVariant[];
  availableVariants?: CartVariant[];
  selectedVariant?: CartVariant | null;
  product?: { variants?: CartVariant[] | null } | null;
};

export type CheckoutForm = {
  email: string;
  fullName: string;
  phoneCountry: string;
  phone: string;
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
  country: string;
  shippingMethod: "standard" | "express";
};

export type AddressSuggestion = {
  city?: string;
  country?: string;
  state?: string;
  postalCode?: string;
  address?: string;
  label: string;
  placeId?: string;
};

export type CheckoutCountry = {
  country: string;
  iso: string;
  code: string;
  postalExample: string;
};

export type ProductAvailabilityItem = {
  itemId: string;
  title: string;
  productId: string;
  variantId?: string | null;
  color?: string | null;
  size?: string | null;
  quantity: number;
  available: boolean;
  reason?: string | null;
};


export function createAddressSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type ProductAvailability = {
  loading: boolean;
  checked: boolean;
  configured: boolean;
  available: boolean;
  country?: string | null;
  countryIso?: string | null;
  shippingMethods?: Array<{ id: string; title: string; price?: number | null; estimatedDays?: string | null }>;
  unavailableItems: ProductAvailabilityItem[];
  message?: string | null;
};

export const GELATO_COUNTRIES: CheckoutCountry[] = [
  {
    "country": "Afghanistan",
    "iso": "AF",
    "code": "+93",
    "postalExample": "Postal code"
  },
  {
    "country": "Albania",
    "iso": "AL",
    "code": "+355",
    "postalExample": "Postal code"
  },
  {
    "country": "Algeria",
    "iso": "DZ",
    "code": "+213",
    "postalExample": "Postal code"
  },
  {
    "country": "American Samoa",
    "iso": "AS",
    "code": "+1684",
    "postalExample": "Postal code"
  },
  {
    "country": "Angola",
    "iso": "AO",
    "code": "+244",
    "postalExample": "Postal code"
  },
  {
    "country": "Anguilla",
    "iso": "AI",
    "code": "+1264",
    "postalExample": "Postal code"
  },
  {
    "country": "Antigua and Barbuda",
    "iso": "AG",
    "code": "+1268",
    "postalExample": "Postal code"
  },
  {
    "country": "Argentina",
    "iso": "AR",
    "code": "+54",
    "postalExample": "Postal code"
  },
  {
    "country": "Armenia",
    "iso": "AM",
    "code": "+374",
    "postalExample": "Postal code"
  },
  {
    "country": "Aruba",
    "iso": "AW",
    "code": "+297",
    "postalExample": "Postal code"
  },
  {
    "country": "Australia",
    "iso": "AU",
    "code": "+61",
    "postalExample": "2000"
  },
  {
    "country": "Austria",
    "iso": "AT",
    "code": "+43",
    "postalExample": "1010"
  },
  {
    "country": "Azerbaijan",
    "iso": "AZ",
    "code": "+994",
    "postalExample": "Postal code"
  },
  {
    "country": "Bahamas",
    "iso": "BS",
    "code": "+1242",
    "postalExample": "Postal code"
  },
  {
    "country": "Bahrain",
    "iso": "BH",
    "code": "+973",
    "postalExample": "Postal code"
  },
  {
    "country": "Bangladesh",
    "iso": "BD",
    "code": "+880",
    "postalExample": "Postal code"
  },
  {
    "country": "Barbados",
    "iso": "BB",
    "code": "+1246",
    "postalExample": "Postal code"
  },
  {
    "country": "Belarus",
    "iso": "BY",
    "code": "+375",
    "postalExample": "Postal code"
  },
  {
    "country": "Belgium",
    "iso": "BE",
    "code": "+32",
    "postalExample": "1000"
  },
  {
    "country": "Belize",
    "iso": "BZ",
    "code": "+501",
    "postalExample": "Postal code"
  },
  {
    "country": "Benin",
    "iso": "BJ",
    "code": "+229",
    "postalExample": "Postal code"
  },
  {
    "country": "Bermuda",
    "iso": "BM",
    "code": "+1441",
    "postalExample": "Postal code"
  },
  {
    "country": "Bhutan",
    "iso": "BT",
    "code": "+975",
    "postalExample": "Postal code"
  },
  {
    "country": "Bolivia",
    "iso": "BO",
    "code": "+591",
    "postalExample": "Postal code"
  },
  {
    "country": "Bosnia and Herzegovina",
    "iso": "BA",
    "code": "+387",
    "postalExample": "Postal code"
  },
  {
    "country": "Botswana",
    "iso": "BW",
    "code": "+267",
    "postalExample": "Postal code"
  },
  {
    "country": "Brazil",
    "iso": "BR",
    "code": "+55",
    "postalExample": "01001-000"
  },
  {
    "country": "British Indian Ocean Territory",
    "iso": "IO",
    "code": "+246",
    "postalExample": "Postal code"
  },
  {
    "country": "Brunei",
    "iso": "BN",
    "code": "+673",
    "postalExample": "Postal code"
  },
  {
    "country": "Bulgaria",
    "iso": "BG",
    "code": "+359",
    "postalExample": "Postal code"
  },
  {
    "country": "Burkina Faso",
    "iso": "BF",
    "code": "+226",
    "postalExample": "Postal code"
  },
  {
    "country": "Burundi",
    "iso": "BI",
    "code": "+257",
    "postalExample": "Postal code"
  },
  {
    "country": "Cambodia",
    "iso": "KH",
    "code": "+855",
    "postalExample": "Postal code"
  },
  {
    "country": "Cameroon",
    "iso": "CM",
    "code": "+237",
    "postalExample": "Postal code"
  },
  {
    "country": "Canada",
    "iso": "CA",
    "code": "+1",
    "postalExample": "M5V 2T6"
  },
  {
    "country": "Cape Verde",
    "iso": "CV",
    "code": "+238",
    "postalExample": "Postal code"
  },
  {
    "country": "Cayman Islands",
    "iso": "KY",
    "code": "+1345",
    "postalExample": "Postal code"
  },
  {
    "country": "Central African Republic",
    "iso": "CF",
    "code": "+236",
    "postalExample": "Postal code"
  },
  {
    "country": "Chad",
    "iso": "TD",
    "code": "+235",
    "postalExample": "Postal code"
  },
  {
    "country": "Chile",
    "iso": "CL",
    "code": "+56",
    "postalExample": "Postal code"
  },
  {
    "country": "China",
    "iso": "CN",
    "code": "+86",
    "postalExample": "Postal code"
  },
  {
    "country": "Christmas Island",
    "iso": "CX",
    "code": "+61",
    "postalExample": "Postal code"
  },
  {
    "country": "Cocos (Keeling) Islands",
    "iso": "CC",
    "code": "+61",
    "postalExample": "Postal code"
  },
  {
    "country": "Colombia",
    "iso": "CO",
    "code": "+57",
    "postalExample": "Postal code"
  },
  {
    "country": "Comoros",
    "iso": "KM",
    "code": "+269",
    "postalExample": "Postal code"
  },
  {
    "country": "Congo",
    "iso": "CG",
    "code": "+242",
    "postalExample": "Postal code"
  },
  {
    "country": "Cook Islands",
    "iso": "CK",
    "code": "+682",
    "postalExample": "Postal code"
  },
  {
    "country": "Costa Rica",
    "iso": "CR",
    "code": "+506",
    "postalExample": "Postal code"
  },
  {
    "country": "Croatia",
    "iso": "HR",
    "code": "+385",
    "postalExample": "Postal code"
  },
  {
    "country": "Cuba",
    "iso": "CU",
    "code": "+53",
    "postalExample": "Postal code"
  },
  {
    "country": "Cyprus",
    "iso": "CY",
    "code": "+357",
    "postalExample": "Postal code"
  },
  {
    "country": "Czechia",
    "iso": "CZ",
    "code": "+420",
    "postalExample": "Postal code"
  },
  {
    "country": "Côte d’Ivoire",
    "iso": "CI",
    "code": "+225",
    "postalExample": "Postal code"
  },
  {
    "country": "DR Congo",
    "iso": "CD",
    "code": "+243",
    "postalExample": "Postal code"
  },
  {
    "country": "Denmark",
    "iso": "DK",
    "code": "+45",
    "postalExample": "Postal code"
  },
  {
    "country": "Djibouti",
    "iso": "DJ",
    "code": "+253",
    "postalExample": "Postal code"
  },
  {
    "country": "Dominica",
    "iso": "DM",
    "code": "+1767",
    "postalExample": "Postal code"
  },
  {
    "country": "Dominican Republic",
    "iso": "DO",
    "code": "+1809",
    "postalExample": "Postal code"
  },
  {
    "country": "Ecuador",
    "iso": "EC",
    "code": "+593",
    "postalExample": "Postal code"
  },
  {
    "country": "Egypt",
    "iso": "EG",
    "code": "+20",
    "postalExample": "Postal code"
  },
  {
    "country": "El Salvador",
    "iso": "SV",
    "code": "+503",
    "postalExample": "Postal code"
  },
  {
    "country": "Equatorial Guinea",
    "iso": "GQ",
    "code": "+240",
    "postalExample": "Postal code"
  },
  {
    "country": "Eritrea",
    "iso": "ER",
    "code": "+291",
    "postalExample": "Postal code"
  },
  {
    "country": "Estonia",
    "iso": "EE",
    "code": "+372",
    "postalExample": "Postal code"
  },
  {
    "country": "Eswatini",
    "iso": "SZ",
    "code": "+268",
    "postalExample": "Postal code"
  },
  {
    "country": "Ethiopia",
    "iso": "ET",
    "code": "+251",
    "postalExample": "Postal code"
  },
  {
    "country": "Falkland Islands",
    "iso": "FK",
    "code": "+500",
    "postalExample": "Postal code"
  },
  {
    "country": "Faroe Islands",
    "iso": "FO",
    "code": "+298",
    "postalExample": "Postal code"
  },
  {
    "country": "Federated States of Micronesia",
    "iso": "FM",
    "code": "+691",
    "postalExample": "Postal code"
  },
  {
    "country": "Fiji",
    "iso": "FJ",
    "code": "+679",
    "postalExample": "Postal code"
  },
  {
    "country": "Finland",
    "iso": "FI",
    "code": "+358",
    "postalExample": "Postal code"
  },
  {
    "country": "France",
    "iso": "FR",
    "code": "+33",
    "postalExample": "75001"
  },
  {
    "country": "French Guiana",
    "iso": "GF",
    "code": "+594",
    "postalExample": "Postal code"
  },
  {
    "country": "French Polynesia",
    "iso": "PF",
    "code": "+689",
    "postalExample": "Postal code"
  },
  {
    "country": "Gabon",
    "iso": "GA",
    "code": "+241",
    "postalExample": "Postal code"
  },
  {
    "country": "Gambia",
    "iso": "GM",
    "code": "+220",
    "postalExample": "Postal code"
  },
  {
    "country": "Georgia",
    "iso": "GE",
    "code": "+995",
    "postalExample": "Postal code"
  },
  {
    "country": "Germany",
    "iso": "DE",
    "code": "+49",
    "postalExample": "10115"
  },
  {
    "country": "Ghana",
    "iso": "GH",
    "code": "+233",
    "postalExample": "Postal code"
  },
  {
    "country": "Gibraltar",
    "iso": "GI",
    "code": "+350",
    "postalExample": "Postal code"
  },
  {
    "country": "Greece",
    "iso": "GR",
    "code": "+30",
    "postalExample": "Postal code"
  },
  {
    "country": "Greenland",
    "iso": "GL",
    "code": "+299",
    "postalExample": "Postal code"
  },
  {
    "country": "Grenada",
    "iso": "GD",
    "code": "+1473",
    "postalExample": "Postal code"
  },
  {
    "country": "Guadeloupe",
    "iso": "GP",
    "code": "+590",
    "postalExample": "Postal code"
  },
  {
    "country": "Guam",
    "iso": "GU",
    "code": "+1671",
    "postalExample": "Postal code"
  },
  {
    "country": "Guatemala",
    "iso": "GT",
    "code": "+502",
    "postalExample": "Postal code"
  },
  {
    "country": "Guernsey",
    "iso": "GG",
    "code": "+44",
    "postalExample": "Postal code"
  },
  {
    "country": "Guinea",
    "iso": "GN",
    "code": "+224",
    "postalExample": "Postal code"
  },
  {
    "country": "Guinea-Bissau",
    "iso": "GW",
    "code": "+245",
    "postalExample": "Postal code"
  },
  {
    "country": "Guyana",
    "iso": "GY",
    "code": "+592",
    "postalExample": "Postal code"
  },
  {
    "country": "Haiti",
    "iso": "HT",
    "code": "+509",
    "postalExample": "Postal code"
  },
  {
    "country": "Honduras",
    "iso": "HN",
    "code": "+504",
    "postalExample": "Postal code"
  },
  {
    "country": "Hong Kong",
    "iso": "HK",
    "code": "+852",
    "postalExample": "Postal code"
  },
  {
    "country": "Hungary",
    "iso": "HU",
    "code": "+36",
    "postalExample": "Postal code"
  },
  {
    "country": "Iceland",
    "iso": "IS",
    "code": "+354",
    "postalExample": "Postal code"
  },
  {
    "country": "India",
    "iso": "IN",
    "code": "+91",
    "postalExample": "Postal code"
  },
  {
    "country": "Indonesia",
    "iso": "ID",
    "code": "+62",
    "postalExample": "Postal code"
  },
  {
    "country": "Iran",
    "iso": "IR",
    "code": "+98",
    "postalExample": "Postal code"
  },
  {
    "country": "Iraq",
    "iso": "IQ",
    "code": "+964",
    "postalExample": "Postal code"
  },
  {
    "country": "Ireland",
    "iso": "IE",
    "code": "+353",
    "postalExample": "D02 X285"
  },
  {
    "country": "Isle of Man",
    "iso": "IM",
    "code": "+44",
    "postalExample": "Postal code"
  },
  {
    "country": "Israel",
    "iso": "IL",
    "code": "+972",
    "postalExample": "Postal code"
  },
  {
    "country": "Italy",
    "iso": "IT",
    "code": "+39",
    "postalExample": "00118"
  },
  {
    "country": "Jamaica",
    "iso": "JM",
    "code": "+1876",
    "postalExample": "Postal code"
  },
  {
    "country": "Japan",
    "iso": "JP",
    "code": "+81",
    "postalExample": "100-0001"
  },
  {
    "country": "Jersey",
    "iso": "JE",
    "code": "+44",
    "postalExample": "Postal code"
  },
  {
    "country": "Jordan",
    "iso": "JO",
    "code": "+962",
    "postalExample": "Postal code"
  },
  {
    "country": "Kazakhstan",
    "iso": "KZ",
    "code": "+76",
    "postalExample": "Postal code"
  },
  {
    "country": "Kenya",
    "iso": "KE",
    "code": "+254",
    "postalExample": "Postal code"
  },
  {
    "country": "Kiribati",
    "iso": "KI",
    "code": "+686",
    "postalExample": "Postal code"
  },
  {
    "country": "Kuwait",
    "iso": "KW",
    "code": "+965",
    "postalExample": "Postal code"
  },
  {
    "country": "Kyrgyzstan",
    "iso": "KG",
    "code": "+996",
    "postalExample": "Postal code"
  },
  {
    "country": "Laos",
    "iso": "LA",
    "code": "+856",
    "postalExample": "Postal code"
  },
  {
    "country": "Latvia",
    "iso": "LV",
    "code": "+371",
    "postalExample": "Postal code"
  },
  {
    "country": "Lebanon",
    "iso": "LB",
    "code": "+961",
    "postalExample": "Postal code"
  },
  {
    "country": "Lesotho",
    "iso": "LS",
    "code": "+266",
    "postalExample": "Postal code"
  },
  {
    "country": "Liberia",
    "iso": "LR",
    "code": "+231",
    "postalExample": "Postal code"
  },
  {
    "country": "Libya",
    "iso": "LY",
    "code": "+218",
    "postalExample": "Postal code"
  },
  {
    "country": "Liechtenstein",
    "iso": "LI",
    "code": "+423",
    "postalExample": "Postal code"
  },
  {
    "country": "Lithuania",
    "iso": "LT",
    "code": "+370",
    "postalExample": "Postal code"
  },
  {
    "country": "Luxembourg",
    "iso": "LU",
    "code": "+352",
    "postalExample": "Postal code"
  },
  {
    "country": "Macau",
    "iso": "MO",
    "code": "+853",
    "postalExample": "Postal code"
  },
  {
    "country": "Madagascar",
    "iso": "MG",
    "code": "+261",
    "postalExample": "Postal code"
  },
  {
    "country": "Malawi",
    "iso": "MW",
    "code": "+265",
    "postalExample": "Postal code"
  },
  {
    "country": "Malaysia",
    "iso": "MY",
    "code": "+60",
    "postalExample": "Postal code"
  },
  {
    "country": "Maldives",
    "iso": "MV",
    "code": "+960",
    "postalExample": "Postal code"
  },
  {
    "country": "Mali",
    "iso": "ML",
    "code": "+223",
    "postalExample": "Postal code"
  },
  {
    "country": "Malta",
    "iso": "MT",
    "code": "+356",
    "postalExample": "Postal code"
  },
  {
    "country": "Marshall Islands",
    "iso": "MH",
    "code": "+692",
    "postalExample": "Postal code"
  },
  {
    "country": "Martinique",
    "iso": "MQ",
    "code": "+596",
    "postalExample": "Postal code"
  },
  {
    "country": "Mauritania",
    "iso": "MR",
    "code": "+222",
    "postalExample": "Postal code"
  },
  {
    "country": "Mauritius",
    "iso": "MU",
    "code": "+230",
    "postalExample": "Postal code"
  },
  {
    "country": "Mayotte",
    "iso": "YT",
    "code": "+262",
    "postalExample": "Postal code"
  },
  {
    "country": "Mexico",
    "iso": "MX",
    "code": "+52",
    "postalExample": "06000"
  },
  {
    "country": "Moldova",
    "iso": "MD",
    "code": "+373",
    "postalExample": "Postal code"
  },
  {
    "country": "Monaco",
    "iso": "MC",
    "code": "+377",
    "postalExample": "Postal code"
  },
  {
    "country": "Mongolia",
    "iso": "MN",
    "code": "+976",
    "postalExample": "Postal code"
  },
  {
    "country": "Montserrat",
    "iso": "MS",
    "code": "+1664",
    "postalExample": "Postal code"
  },
  {
    "country": "Morocco",
    "iso": "MA",
    "code": "+212",
    "postalExample": "Postal code"
  },
  {
    "country": "Mozambique",
    "iso": "MZ",
    "code": "+258",
    "postalExample": "Postal code"
  },
  {
    "country": "Namibia",
    "iso": "NA",
    "code": "+264",
    "postalExample": "Postal code"
  },
  {
    "country": "Nauru",
    "iso": "NR",
    "code": "+674",
    "postalExample": "Postal code"
  },
  {
    "country": "Nepal",
    "iso": "NP",
    "code": "+977",
    "postalExample": "Postal code"
  },
  {
    "country": "Netherlands",
    "iso": "NL",
    "code": "+31",
    "postalExample": "1011 AB"
  },
  {
    "country": "New Caledonia",
    "iso": "NC",
    "code": "+687",
    "postalExample": "Postal code"
  },
  {
    "country": "New Zealand",
    "iso": "NZ",
    "code": "+64",
    "postalExample": "6011"
  },
  {
    "country": "Nicaragua",
    "iso": "NI",
    "code": "+505",
    "postalExample": "Postal code"
  },
  {
    "country": "Niger",
    "iso": "NE",
    "code": "+227",
    "postalExample": "Postal code"
  },
  {
    "country": "Nigeria",
    "iso": "NG",
    "code": "+234",
    "postalExample": "Postal code"
  },
  {
    "country": "Niue",
    "iso": "NU",
    "code": "+683",
    "postalExample": "Postal code"
  },
  {
    "country": "Norfolk Island",
    "iso": "NF",
    "code": "+672",
    "postalExample": "Postal code"
  },
  {
    "country": "North Korea",
    "iso": "KP",
    "code": "+850",
    "postalExample": "Postal code"
  },
  {
    "country": "North Macedonia",
    "iso": "MK",
    "code": "+389",
    "postalExample": "Postal code"
  },
  {
    "country": "Northern Mariana Islands",
    "iso": "MP",
    "code": "+1670",
    "postalExample": "Postal code"
  },
  {
    "country": "Norway",
    "iso": "NO",
    "code": "+47",
    "postalExample": "Postal code"
  },
  {
    "country": "Oman",
    "iso": "OM",
    "code": "+968",
    "postalExample": "Postal code"
  },
  {
    "country": "Pakistan",
    "iso": "PK",
    "code": "+92",
    "postalExample": "Postal code"
  },
  {
    "country": "Palau",
    "iso": "PW",
    "code": "+680",
    "postalExample": "Postal code"
  },
  {
    "country": "Panama",
    "iso": "PA",
    "code": "+507",
    "postalExample": "Postal code"
  },
  {
    "country": "Papua New Guinea",
    "iso": "PG",
    "code": "+675",
    "postalExample": "Postal code"
  },
  {
    "country": "Paraguay",
    "iso": "PY",
    "code": "+595",
    "postalExample": "Postal code"
  },
  {
    "country": "Peru",
    "iso": "PE",
    "code": "+51",
    "postalExample": "Postal code"
  },
  {
    "country": "Philippines",
    "iso": "PH",
    "code": "+63",
    "postalExample": "Postal code"
  },
  {
    "country": "Pitcairn Islands",
    "iso": "PN",
    "code": "+64",
    "postalExample": "Postal code"
  },
  {
    "country": "Poland",
    "iso": "PL",
    "code": "+48",
    "postalExample": "Postal code"
  },
  {
    "country": "Portugal",
    "iso": "PT",
    "code": "+351",
    "postalExample": "1000-001"
  },
  {
    "country": "Puerto Rico",
    "iso": "PR",
    "code": "+1787",
    "postalExample": "Postal code"
  },
  {
    "country": "Qatar",
    "iso": "QA",
    "code": "+974",
    "postalExample": "Postal code"
  },
  {
    "country": "Romania",
    "iso": "RO",
    "code": "+40",
    "postalExample": "Postal code"
  },
  {
    "country": "Russia",
    "iso": "RU",
    "code": "+7",
    "postalExample": "Postal code"
  },
  {
    "country": "Rwanda",
    "iso": "RW",
    "code": "+250",
    "postalExample": "Postal code"
  },
  {
    "country": "Réunion",
    "iso": "RE",
    "code": "+262",
    "postalExample": "Postal code"
  },
  {
    "country": "Saint Helena",
    "iso": "SH",
    "code": "+290",
    "postalExample": "Postal code"
  },
  {
    "country": "Saint Kitts and Nevis",
    "iso": "KN",
    "code": "+1869",
    "postalExample": "Postal code"
  },
  {
    "country": "Saint Lucia",
    "iso": "LC",
    "code": "+1758",
    "postalExample": "Postal code"
  },
  {
    "country": "Saint Pierre and Miquelon",
    "iso": "PM",
    "code": "+508",
    "postalExample": "Postal code"
  },
  {
    "country": "Saint Vincent and the Grenadines",
    "iso": "VC",
    "code": "+1784",
    "postalExample": "Postal code"
  },
  {
    "country": "Samoa",
    "iso": "WS",
    "code": "+685",
    "postalExample": "Postal code"
  },
  {
    "country": "San Marino",
    "iso": "SM",
    "code": "+378",
    "postalExample": "Postal code"
  },
  {
    "country": "Saudi Arabia",
    "iso": "SA",
    "code": "+966",
    "postalExample": "Postal code"
  },
  {
    "country": "Senegal",
    "iso": "SN",
    "code": "+221",
    "postalExample": "Postal code"
  },
  {
    "country": "Serbia",
    "iso": "RS",
    "code": "+381",
    "postalExample": "Postal code"
  },
  {
    "country": "Seychelles",
    "iso": "SC",
    "code": "+248",
    "postalExample": "Postal code"
  },
  {
    "country": "Sierra Leone",
    "iso": "SL",
    "code": "+232",
    "postalExample": "Postal code"
  },
  {
    "country": "Singapore",
    "iso": "SG",
    "code": "+65",
    "postalExample": "Postal code"
  },
  {
    "country": "Slovakia",
    "iso": "SK",
    "code": "+421",
    "postalExample": "Postal code"
  },
  {
    "country": "Slovenia",
    "iso": "SI",
    "code": "+386",
    "postalExample": "Postal code"
  },
  {
    "country": "Solomon Islands",
    "iso": "SB",
    "code": "+677",
    "postalExample": "Postal code"
  },
  {
    "country": "Somalia",
    "iso": "SO",
    "code": "+252",
    "postalExample": "Postal code"
  },
  {
    "country": "South Africa",
    "iso": "ZA",
    "code": "+27",
    "postalExample": "Postal code"
  },
  {
    "country": "South Korea",
    "iso": "KR",
    "code": "+82",
    "postalExample": "Postal code"
  },
  {
    "country": "South Sudan",
    "iso": "SS",
    "code": "+211",
    "postalExample": "Postal code"
  },
  {
    "country": "Spain",
    "iso": "ES",
    "code": "+34",
    "postalExample": "28001"
  },
  {
    "country": "Sri Lanka",
    "iso": "LK",
    "code": "+94",
    "postalExample": "Postal code"
  },
  {
    "country": "Sudan",
    "iso": "SD",
    "code": "+249",
    "postalExample": "Postal code"
  },
  {
    "country": "Suriname",
    "iso": "SR",
    "code": "+597",
    "postalExample": "Postal code"
  },
  {
    "country": "Svalbard and Jan Mayen",
    "iso": "SJ",
    "code": "+4779",
    "postalExample": "Postal code"
  },
  {
    "country": "Sweden",
    "iso": "SE",
    "code": "+46",
    "postalExample": "Postal code"
  },
  {
    "country": "Switzerland",
    "iso": "CH",
    "code": "+41",
    "postalExample": "8001"
  },
  {
    "country": "Syria",
    "iso": "SY",
    "code": "+963",
    "postalExample": "Postal code"
  },
  {
    "country": "São Tomé and Príncipe",
    "iso": "ST",
    "code": "+239",
    "postalExample": "Postal code"
  },
  {
    "country": "Taiwan",
    "iso": "TW",
    "code": "+886",
    "postalExample": "Postal code"
  },
  {
    "country": "Tajikistan",
    "iso": "TJ",
    "code": "+992",
    "postalExample": "Postal code"
  },
  {
    "country": "Tanzania",
    "iso": "TZ",
    "code": "+255",
    "postalExample": "Postal code"
  },
  {
    "country": "Thailand",
    "iso": "TH",
    "code": "+66",
    "postalExample": "Postal code"
  },
  {
    "country": "Timor-Leste",
    "iso": "TL",
    "code": "+670",
    "postalExample": "Postal code"
  },
  {
    "country": "Togo",
    "iso": "TG",
    "code": "+228",
    "postalExample": "Postal code"
  },
  {
    "country": "Tokelau",
    "iso": "TK",
    "code": "+690",
    "postalExample": "Postal code"
  },
  {
    "country": "Tonga",
    "iso": "TO",
    "code": "+676",
    "postalExample": "Postal code"
  },
  {
    "country": "Trinidad and Tobago",
    "iso": "TT",
    "code": "+1868",
    "postalExample": "Postal code"
  },
  {
    "country": "Tunisia",
    "iso": "TN",
    "code": "+216",
    "postalExample": "Postal code"
  },
  {
    "country": "Turkey",
    "iso": "TR",
    "code": "+90",
    "postalExample": "Postal code"
  },
  {
    "country": "Turkmenistan",
    "iso": "TM",
    "code": "+993",
    "postalExample": "Postal code"
  },
  {
    "country": "Tuvalu",
    "iso": "TV",
    "code": "+688",
    "postalExample": "Postal code"
  },
  {
    "country": "Uganda",
    "iso": "UG",
    "code": "+256",
    "postalExample": "Postal code"
  },
  {
    "country": "Ukraine",
    "iso": "UA",
    "code": "+380",
    "postalExample": "Postal code"
  },
  {
    "country": "United Arab Emirates",
    "iso": "AE",
    "code": "+971",
    "postalExample": "Postal code"
  },
  {
    "country": "United Kingdom",
    "iso": "GB",
    "code": "+44",
    "postalExample": "SW1A 1AA"
  },
  {
    "country": "United States",
    "iso": "US",
    "code": "+1",
    "postalExample": "10001"
  },
  {
    "country": "Uruguay",
    "iso": "UY",
    "code": "+598",
    "postalExample": "Postal code"
  },
  {
    "country": "Uzbekistan",
    "iso": "UZ",
    "code": "+998",
    "postalExample": "Postal code"
  },
  {
    "country": "Vanuatu",
    "iso": "VU",
    "code": "+678",
    "postalExample": "Postal code"
  },
  {
    "country": "Venezuela",
    "iso": "VE",
    "code": "+58",
    "postalExample": "Postal code"
  },
  {
    "country": "Vietnam",
    "iso": "VN",
    "code": "+84",
    "postalExample": "Postal code"
  },
  {
    "country": "Wallis and Futuna",
    "iso": "WF",
    "code": "+681",
    "postalExample": "Postal code"
  },
  {
    "country": "Western Sahara",
    "iso": "EH",
    "code": "+212",
    "postalExample": "Postal code"
  },
  {
    "country": "Yemen",
    "iso": "YE",
    "code": "+967",
    "postalExample": "Postal code"
  },
  {
    "country": "Zambia",
    "iso": "ZM",
    "code": "+260",
    "postalExample": "Postal code"
  },
  {
    "country": "Zimbabwe",
    "iso": "ZW",
    "code": "+263",
    "postalExample": "Postal code"
  }
];

export const COUNTRY_DIALS = GELATO_COUNTRIES;

export const normalizeCountryName = (value?: string | null) =>
  (value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function resolveCheckoutCountry(value?: string | null) {
  const normalized = normalizeCountryName(value);
  if (!normalized) return null;

  const aliases: Record<string, string> = {
    usa: "United States",
    us: "United States",
    "united states of america": "United States",
    uk: "United Kingdom",
    gb: "United Kingdom",
    england: "United Kingdom",
    scotland: "United Kingdom",
    wales: "United Kingdom",
    "czech republic": "Czechia",
    "republic of macedonia": "North Macedonia",
    macedonia: "North Macedonia",
    swaziland: "Eswatini",
    "ivory coast": "Côte d’Ivoire",
    "cote d'ivoire": "Côte d’Ivoire",
    "cote divoire": "Côte d’Ivoire",
    "east timor": "Timor-Leste",
  };

  const aliased = aliases[normalized];
  if (aliased) return GELATO_COUNTRIES.find((item) => item.country === aliased) || null;

  return (
    GELATO_COUNTRIES.find((item) => normalizeCountryName(item.country) === normalized) ||
    GELATO_COUNTRIES.find((item) => item.iso.toLowerCase() === normalized) ||
    null
  );
}

export const safeArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

export const CHECKOUT_SESSION_KEY = "ryfio.checkout.form.v1";
export const CHECKOUT_STEP_SESSION_KEY = "ryfio.checkout.step.v1";

export function readCheckoutSession(): CheckoutForm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<CheckoutForm>;
    return {
      email: typeof data.email === "string" ? data.email : "",
      fullName: typeof data.fullName === "string" ? data.fullName : "",
      phoneCountry: typeof data.phoneCountry === "string" ? data.phoneCountry : "+351",
      phone: typeof data.phone === "string" ? data.phone : "",
      address: typeof data.address === "string" ? data.address : "",
      apartment: typeof data.apartment === "string" ? data.apartment : "",
      city: typeof data.city === "string" ? data.city : "",
      postalCode: typeof data.postalCode === "string" ? data.postalCode : "",
      country: typeof data.country === "string" ? data.country : "",
      shippingMethod: data.shippingMethod === "express" ? "express" : "standard",
    };
  } catch {
    return null;
  }
}

export function readCheckoutStep(): Step {
  if (typeof window === "undefined") return "shipping";
  const value = window.sessionStorage.getItem(CHECKOUT_STEP_SESSION_KEY);
  return value === "review" || value === "payment" ? value : "shipping";
}
export const money = (value: number) => `€${value.toFixed(2)}`;

export const fieldClass =
  "h-12 w-full rounded-none border-0 border-b border-white/12 bg-transparent px-0 text-sm font-semibold text-white outline-none transition placeholder:text-white/25 focus:border-purple-300/80";

export const selectClass =
  "h-12 w-full rounded-none border-0 border-b border-white/12 bg-transparent px-0 text-sm font-semibold text-white outline-none transition focus:border-purple-300/80 [&_option]:bg-[#0b0b13] [&_option]:text-white";

export function getCountryCode(country: string) {
  return resolveCheckoutCountry(country)?.code ?? "+351";
}

export function getPostalPlaceholder(country: string) {
  return resolveCheckoutCountry(country)?.postalExample ?? "Postal code";
}

export function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function getPhoneRule(country: string, dialCode: string) {
  const iso = resolveCheckoutCountry(country)?.iso;
  const normalizedDialCode = dialCode.replace(/\D/g, "");

  const rules: Record<string, { min: number; max: number; example: string }> = {
    PT: { min: 9, max: 9, example: "912 345 678" },
    FR: { min: 9, max: 10, example: "06 12 34 56 78" },
    ES: { min: 9, max: 9, example: "612 345 678" },
    GB: { min: 10, max: 11, example: "07123 456789" },
    US: { min: 10, max: 10, example: "202 555 0123" },
    CA: { min: 10, max: 10, example: "416 555 0123" },
    DE: { min: 10, max: 12, example: "1512 3456789" },
    IT: { min: 9, max: 10, example: "312 345 6789" },
    NL: { min: 9, max: 9, example: "06 12345678" },
    BE: { min: 8, max: 9, example: "0470 12 34 56" },
    CH: { min: 9, max: 9, example: "076 123 45 67" },
  };

  if (iso && rules[iso]) return rules[iso];
  if (normalizedDialCode === "1") return rules.US;
  return { min: 6, max: 15, example: "Phone number" };
}

export function validatePhoneNumber(country: string, dialCode: string, phone: string) {
  const digits = normalizeDigits(phone);
  const rule = getPhoneRule(country, dialCode);
  return {
    valid: digits.length >= rule.min && digits.length <= rule.max,
    digits,
    rule,
  };
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function variantId(variant: CartVariant) {
  return variant.id || variant.variant_id || `${variantColor(variant) || ""}-${variantSize(variant) || ""}-${variant.sku || ""}`;
}

export function variantColor(variant: CartVariant) {
  return variant.color || variant.color_name || variant.product_color?.color || variant.product_color?.color_name || variant.product_color?.name || variant.product_color?.title || variant.product_colors?.color || variant.product_colors?.color_name || variant.product_colors?.name || variant.product_colors?.title || null;
}

export function variantHex(variant: CartVariant) {
  return variant.color_hex || variant.hex || variant.product_color?.color_hex || variant.product_color?.hex || variant.product_colors?.color_hex || variant.product_colors?.hex || "#9ca3af";
}

export function variantImage(variant: CartVariant | null | undefined) {
  return variant?.image || variant?.image_url || variant?.product_color?.image || variant?.product_color?.image_url || variant?.product_colors?.image || variant?.product_colors?.image_url || null;
}

export function variantPrice(variant: CartVariant | null | undefined, fallback = 0) {
  if (!variant) return fallback;
  return toNumber(variant.price) ?? toNumber(variant.final_price) ?? toNumber(variant.base_price) ?? fallback;
}

export function variantStock(variant: CartVariant | null | undefined) {
  return toNumber(variant?.stock) ?? 0;
}

export function variantSku(variant: CartVariant | null | undefined) {
  return variant?.sku || null;
}

export function variantProductColorId(variant: CartVariant | null | undefined) {
  return variant?.product_color_id || variant?.product_color?.id || variant?.product_colors?.id || null;
}

export function isVariantAvailable(variant: CartVariant | null | undefined) {
  return variantStock(variant) > 0;
}

export function getVariantLookupProductIds(item: CartItem) {
  return Array.from(
    new Set(
      [
        item.base_product_id,
        item.baseProductId,
        item.product_id,
        item.user_product_id,
        item.userProductId,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );
}

export function getCartProductId(item: CartItem) {
  return getVariantLookupProductIds(item)[0] || "";
}

export function variantSize(variant: CartVariant) {
  return variant.size || variant.title || variant.name || null;
}

export function normalizeVariantLabel(variant: CartVariant) {
  return [variantColor(variant), variantSize(variant)].filter(Boolean).join(" / ") || "Variant";
}
