import create from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { SupportedCurrencies } from "~~/utils/link";
import { ChainWithAttributes } from "~~/utils/scaffold-eth";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 */

export interface PaymentReference {
  reference: string;
  amount: number;
  currency: SupportedCurrencies;
}

type GlobalState = {
  nativeCurrency: {
    price: number;
    isFetching: boolean;
  };
  secret: string;
  references: PaymentReference[];

  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  setIsNativeCurrencyFetching: (newIsNativeCurrencyFetching: boolean) => void;
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;

  setSecret: (secret: string) => void;
  addReference: (ref: PaymentReference) => void;
};

export const useGlobalState = create<GlobalState>(set => ({
  nativeCurrency: {
    price: 0,
    isFetching: true,
  },
  secret: "",
  references: [],

  setNativeCurrencyPrice: (newValue: number): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, price: newValue } })),
  setIsNativeCurrencyFetching: (newValue: boolean): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, isFetching: newValue } })),
  targetNetwork: scaffoldConfig.targetNetworks[0],
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),

  setSecret: (newValue: string): void => set(() => ({ secret: newValue })),
  addReference: (newValue: PaymentReference): void => set(state => ({ references: [...state.references, newValue] })),
}));
