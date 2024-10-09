export type SupportedCurrencies = "ETH" | "USD";

export function createPaymentLink(
  reference: string,
  amount: string | number = 0,
  currency: SupportedCurrencies = "ETH",
): string {
  const root = global.location.origin;
  const route = "pay";
  const elements = [root, route, reference];
  if (amount) {
    elements.push(amount + "", currency);
  }
  const link = elements.join("/");
  return link;
}
