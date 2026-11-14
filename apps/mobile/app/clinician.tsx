import { ClinicianView } from '../src/features/clinician/ClinicianView';
import { useClinicianViewModel } from '../src/features/clinician/useClinicianViewModel';

export default function ClinicianScreen() {
  return <ClinicianView {...useClinicianViewModel()} />;
}
