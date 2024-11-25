
export const rotl = (xn_word: number, n_shift: number): number => (xn_word << n_shift) | (xn_word >>> (32 - n_shift));
