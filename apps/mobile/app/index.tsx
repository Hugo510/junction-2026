import { Redirect } from 'expo-router';

import { useData } from '../src/store/data';
import { useSettings } from '../src/store/settings';

export default function Index() {
  const onboarded = useSettings((s) => s.onboarded);
  const patient = useData((s) => s.patient);
  return <Redirect href={onboarded && patient ? '/chat' : '/start'} />;
}
