import { View, type ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'today'
  | 'checkin'
  | 'comfort'
  | 'insights'
  | 'care'
  | 'settings'
  | 'help'
  | 'check'
  | 'close'
  | 'shield'
  | 'menu'
  | 'send'
  | 'journal'
  | 'plus'
  | 'chat'
  | 'chevronLeft'
  | 'chevronRight'
  | 'info';

/** Small original line icons drawn with react-native-svg. Decorative: labels live on the controls. */
export function Icon({ name, color, size = 24 }: { name: IconName; color: ColorValue; size?: number }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <View aria-hidden>
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'today' && (
        <>
          <Circle cx={12} cy={12} r={4.5} {...p} />
          <Path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" {...p} />
        </>
      )}
      {name === 'checkin' && <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" {...p} />}
      {name === 'comfort' && (
        <>
          <Path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" {...p} />
          <Path d="M5 19l7-7" {...p} />
        </>
      )}
      {name === 'insights' && <Path d="M4 19h16M7 16v-4M12 16V7M17 16v-6" {...p} />}
      {name === 'care' && (
        <>
          <Circle cx={9} cy={8} r={3} {...p} />
          <Path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" {...p} />
          <Circle cx={17} cy={9} r={2.3} {...p} />
          <Path d="M16 14.2c2.4-.3 4 1.2 4.5 3.8" {...p} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...p} />
          <Circle cx={15} cy={7} r={2.2} {...p} />
          <Circle cx={9} cy={17} r={2.2} {...p} />
        </>
      )}
      {name === 'help' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...p} />
          <Circle cx={12} cy={12} r={3.5} {...p} />
          <Path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5" {...p} />
        </>
      )}
      {name === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6L6 18" {...p} />}
      {name === 'shield' && <Path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" {...p} />}
      {name === 'menu' && <Path d="M4 7h16M4 12h10M4 17h16" {...p} />}
      {name === 'send' && <Path d="M12 19V5M6 11l6-6 6 6" {...p} />}
      {name === 'journal' && (
        <>
          <Path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 17 20.5H6z" {...p} />
          <Path d="M6 3.5v17M10 8h5M10 11.5h5" {...p} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === 'chat' && <Path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5h-2.5z" {...p} />}
      {name === 'chevronLeft' && <Path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'chevronRight' && <Path d="M9 5l7 7-7 7" {...p} />}
      {name === 'info' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...p} />
          <Path d="M12 11v5M12 8h.01" {...p} />
        </>
      )}
    </Svg>
    </View>
  );
}
