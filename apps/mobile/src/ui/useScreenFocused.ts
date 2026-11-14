import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/** true while the screen is focused. Animations and sensors pause when the user navigates away. */
export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}
