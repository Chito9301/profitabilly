import type { Messages } from "./messages";

// lib/finance/validation.ts (and the local category check in the costs
// actions) return their error text in English and must not change, so
// the translation happens here, at the call site: the exact English
// message is mapped to a dictionary key. An unknown message is returned
// untouched (English), so a future wording change in validation.ts can
// never hide an error — it just shows up untranslated.
const KEY_BY_MESSAGE: Record<string, keyof Messages["entries"]["validation"]> = {
  "Description is required.": "descriptionRequired",
  "Amount is required.": "amountRequired",
  "Enter a valid amount (up to 2 decimal places).": "amountInvalid",
  "Amount must be greater than zero.": "amountPositive",
  "Enter a valid date.": "dateInvalid",
  "Please select a valid category.": "categoryInvalid",
};

export const FINANCE_ERROR_MESSAGES = Object.keys(KEY_BY_MESSAGE);

export function translateFinanceError(message: string, messages: Messages): string {
  const key = KEY_BY_MESSAGE[message];
  return key ? messages.entries.validation[key] : message;
}
