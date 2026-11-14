import * as Haptics from 'expo-haptics';

import { useSettings } from '../store/settings';

/** Gentle haptics, only when the user enabled vibration. Failures are ignored (e.g. web). */
const enabled = () => useSettings.getState().consents.vibration;

export const haptics = {
  tap: () => {
    if (enabled()) Haptics.selectionAsync().catch(() => undefined);
  },
  confirm: () => {
    if (enabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  },
  pulse: () => {
    if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  },
  soft: () => {
    if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => undefined);
  },
};
