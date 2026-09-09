// Grounded in the business types Profitabilly targets (see project
// README). Plain arrays, not an enum/DB constraint — business_type and
// currency are free-text columns, so this only shapes the signup form.
export const BUSINESS_TYPES = [
  "Agency",
  "Consultant",
  "Freelancer",
  "Construction",
  "Contractor",
  "Service business",
  "Other",
] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
