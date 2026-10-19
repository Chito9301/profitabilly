import type { Locale } from "../config";
import { en, type Messages } from "./en";
import { es } from "./es";

export type { Messages };

const DICTIONARIES: Record<Locale, Messages> = { en, es };

export function getMessagesFor(locale: Locale): Messages {
  return DICTIONARIES[locale];
}
