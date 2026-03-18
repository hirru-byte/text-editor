import { CAN_USE_DOM } from "./canUseDOM";

export const IS_APPLE: boolean =
  CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
