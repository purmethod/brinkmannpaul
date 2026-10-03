import { useStore } from '@/state/store';

import { STRINGS, type Strings } from './strings';

export { PUR_URL, STRINGS, type Strings } from './strings';

export function useStrings(): Strings {
  return STRINGS[useStore().state.language];
}
