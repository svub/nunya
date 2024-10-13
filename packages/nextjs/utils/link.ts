import { PaymentReference } from "~~/services/store/store";

export type SupportedCurrencies = "ETH" | "USD";

export function createPaymentLink(ref: PaymentReference): string {
  const root = global.location.origin;
  const route = "pay";
  const elements = [root, route, ref.reference];
  if (ref.amount) {
    elements.push(ref.amount + "", ref.currency);
  }
  const link = elements.join("/");
  return link;
}
