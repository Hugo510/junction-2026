import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DEFAULT_LATITUDE, daylightHours } from '../../src/domain/daylight';
import { ExerciseShell } from '../../src/features/ExerciseShell';
import { haptics } from '../../src/services/haptics';
import { approximateLatitude, requestLocationPermission, useOutdoorEstimate } from '../../src/services/sensors/location';
import { now } from '../../src/store/clock';
import { useData } from '../../src/store/data';
import { useSettings } from '../../src/store/settings';
import { AppText, Button, Card, Slider, spacing } from '../../src/ui';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Daylight walk: timer + optional approximate outdoor estimate (no coordinates stored). */
export default function WalkScreen() {
  const { t } = useTranslation();
  const locationAllowed = useSettings((s) => s.consents.location);
  const addSensorMinutes = useData((s) => s.addSensorMinutes);

  const [latitude, setLatitude] = useState(DEFAULT_LATITUDE);
  const [usingLocation, setUsingLocation] = useState(false);
  const [state, setState] = useState<'idle' | 'running' | 'confirm' | 'saved'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(10);
  const [savedMinutes, setSavedMinutes] = useState(0);
  const startedAt = useRef<number>(0);
  const outdoor = useOutdoorEstimate(state === 'running', locationAllowed && usingLocation);

  useEffect(() => {
    if (!locationAllowed) return;
    (async () => {
      if (!(await requestLocationPermission())) return;
      const lat = await approximateLatitude();
      if (lat !== null) {
        setLatitude(lat);
        setUsingLocation(true);
      }
    })();
  }, [locationAllowed]);

  useEffect(() => {
    if (state !== 'running') return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [state]);

  const hours = daylightHours(latitude, now());

  const start = () => {
    startedAt.current = Date.now();
    setElapsed(0);
    setState('running');
  };

  const finish = () => {
    const walked = Math.max(1, Math.round(elapsed / 60));
    if (usingLocation && outdoor.permission === 'granted' && outdoor.outsideMinutes > 0) {
      void save(outdoor.outsideMinutes, walked);
    } else {
      setManualMinutes(Math.min(60, Math.max(5, Math.round(walked / 5) * 5)));
      setState('confirm');
    }
  };

  const save = async (daylight: number, walked: number) => {
    await addSensorMinutes({ daylightMinutes: daylight, activityMinutes: walked });
    setSavedMinutes(daylight);
    setState('saved');
    haptics.confirm();
  };

  return (
    <ExerciseShell id="daylightWalk" showFeedback={state === 'saved'}>
      <Card tone="sand">
        <AppText variant="heading">{t('comfort.walk.daylightToday', { hours: hours.toFixed(1) })}</AppText>
        <AppText variant="caption" tone="muted">
          {usingLocation ? t('comfort.walk.locationOn') : t('comfort.walk.locationOff')}
        </AppText>
        {outdoor.permission === 'denied' ? (
          <AppText variant="caption" tone="muted">
            {t('comfort.walk.permissionDenied')}
          </AppText>
        ) : null}
      </Card>

      {state === 'running' ? (
        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          <AppText variant="display" accessibilityLiveRegion="polite">
            {t('comfort.walk.elapsed', { time: fmt(elapsed) })}
          </AppText>
          {usingLocation ? <AppText tone="muted">{t('comfort.walk.outside', { minutes: outdoor.outsideMinutes })}</AppText> : null}
        </View>
      ) : null}

      {state === 'confirm' ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="heading">{t('comfort.walk.manualQuestion')}</AppText>
          <Slider
            label={t('comfort.walk.manualQuestion')}
            value={manualMinutes}
            min={0}
            max={60}
            step={5}
            onChange={setManualMinutes}
            formatValue={(v) => t('common.minutes', { count: v })}
          />
          <Button title={t('common.save')} onPress={() => save(manualMinutes, Math.max(1, Math.round(elapsed / 60)))} />
        </View>
      ) : null}

      {state === 'saved' ? (
        <AppText variant="heading" tone="primary" accessibilityLiveRegion="polite">
          {t('comfort.walk.saved', { minutes: savedMinutes })}
        </AppText>
      ) : null}

      {state === 'idle' || state === 'saved' ? <Button title={t('comfort.walk.start')} onPress={start} /> : null}
      {state === 'running' ? <Button title={t('comfort.walk.finish')} variant="secondary" onPress={finish} /> : null}
    </ExerciseShell>
  );
}
