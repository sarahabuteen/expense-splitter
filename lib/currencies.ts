/**
 * The single source of truth for currencies.
 *
 * DECIMALS ARE NOT ALWAYS 2. JPY and KRW have none, and the Gulf and Levant
 * dinars — JOD, KWD, BHD, OMR, TND, IQD, LYD — have THREE. A Jordanian dinar
 * is 1000 fils, so 1.5 JOD is 1500 minor units, not 150. Assuming 2 everywhere
 * would silently divide those balances by ten.
 *
 * `locale` is chosen for DISAMBIGUATION, not for the user's region: en-US
 * renders CAD as "CA$" and AUD as "A$", where the native locales render both as
 * a bare "$". The MENA currencies use en-US so amounts keep Latin digits and a
 * readable ISO code rather than Arabic-Indic numerals, which would break
 * column alignment in a ledger.
 */
export type Currency = {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  locale: string;
};

export const CURRENCIES: Currency[] = [
  // Required by the spec
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2, locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 2, locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", decimals: 2, locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", decimals: 0, locale: "en-US" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", decimals: 2, locale: "en-US" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimals: 2, locale: "en-US" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimals: 2, locale: "de-CH" },
  { code: "CNY", name: "Chinese Yuan", symbol: "CN¥", decimals: 2, locale: "en-US" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 2, locale: "en-IN" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", decimals: 2, locale: "en-US" },

  // Middle East & North Africa
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimals: 2, locale: "en-US" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", decimals: 2, locale: "en-US" },
  { code: "QAR", name: "Qatari Riyal", symbol: "﷼", decimals: 2, locale: "en-US" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", decimals: 3, locale: "en-US" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", decimals: 3, locale: "en-US" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", decimals: 3, locale: "en-US" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع.", decimals: 3, locale: "en-US" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", decimals: 3, locale: "en-US" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د", decimals: 3, locale: "en-US" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", decimals: 2, locale: "en-US" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", decimals: 2, locale: "en-US" },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", decimals: 2, locale: "en-US" },
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", decimals: 2, locale: "en-US" },

  // Other commonly split-in currencies
  { code: "TRY", name: "Turkish Lira", symbol: "₺", decimals: 2, locale: "en-US" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", decimals: 2, locale: "sv-SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", decimals: 2, locale: "nb-NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", decimals: 2, locale: "da-DK" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", decimals: 2, locale: "pl-PL" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", decimals: 2, locale: "en-US" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimals: 2, locale: "en-US" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", decimals: 2, locale: "en-US" },
  { code: "ZAR", name: "South African Rand", symbol: "R", decimals: 2, locale: "en-ZA" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", decimals: 2, locale: "pt-BR" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", decimals: 0, locale: "en-US" },
  { code: "THB", name: "Thai Baht", symbol: "฿", decimals: 2, locale: "th-TH" },
];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function currencyFor(code: string): Currency | undefined {
  return BY_CODE.get(code.toUpperCase());
}

export function decimalsFor(code: string): number {
  return currencyFor(code)?.decimals ?? 2;
}

export function localeFor(code: string): string {
  return currencyFor(code)?.locale ?? "en-US";
}

export const SUPPORTED_CURRENCIES = CURRENCIES.map((c) => c.code);
