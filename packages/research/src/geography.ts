/**
 * Free-text "geography" (whatever the founder typed in the clarification
 * form) -> ISO 3166-1 alpha-2 country code. Shared by every live source
 * that needs a real country code (App Store storefront, World Bank) so
 * they don't each guess independently and drift out of sync.
 */
const COUNTRY_TO_ISO2: Record<string, string> = {
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  us: "US",
  canada: "CA",
  "united kingdom": "GB",
  uk: "GB",
  england: "GB",
  australia: "AU",
  india: "IN",
  germany: "DE",
  france: "FR",
  brazil: "BR",
  mexico: "MX",
  japan: "JP",
  "south africa": "ZA",
  nigeria: "NG",
  singapore: "SG",
  "united arab emirates": "AE",
  uae: "AE",
  spain: "ES",
  italy: "IT",
  netherlands: "NL",
  ireland: "IE",
  "new zealand": "NZ",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  "south korea": "KR",
  korea: "KR",
  china: "CN",
  indonesia: "ID",
  philippines: "PH",
  vietnam: "VN",
  pakistan: "PK",
  bangladesh: "BD",
  kenya: "KE",
  egypt: "EG",
  "saudi arabia": "SA",
  israel: "IL",
  poland: "PL",
  turkey: "TR",
  argentina: "AR",
  colombia: "CO",
  chile: "CL",
};

/** Returns an ISO2 country code, or null if the text couldn't be matched to one. */
export function resolveCountryCode(geography: string): string | null {
  const normalized = geography.trim().toLowerCase();
  return COUNTRY_TO_ISO2[normalized] ?? null;
}

/**
 * One canonical display name per country, for the geography <select> —
 * a free-text "Where?" field couldn't reliably resolve to a World Bank
 * country code (typos, "the US", city names). Values here are guaranteed
 * to resolve via resolveCountryCode above.
 */
export const COUNTRY_OPTIONS: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "KE", name: "Kenya" },
  { code: "EG", name: "Egypt" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IL", name: "Israel" },
  { code: "PL", name: "Poland" },
  { code: "TR", name: "Turkey" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" },
];
