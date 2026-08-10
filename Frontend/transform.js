const fs = require('fs');
let content = fs.readFileSync('/media/gaurang-rahani/D/Dev/PhysioCare/Frontend/src/features/dashboard/pages/PatientDashboard.jsx', 'utf8');

content = content.replace(
  "import PatientBookingModal from '../components/PatientBookingModal';",
  "import PatientBookingModal from '../components/PatientBookingModal';\nimport TodayTab from '../components/TodayTab';"
);

content = content.replace(
  "const [data, setData] = useState(null);",
  "const [internalUserId, setInternalUserId] = useState(null);"
);

content = content.replace(
  /const internalUserId = profileData\.user\.id;[\s\S]*?setData\(scheduleData\);/,
  "setInternalUserId(profileData.user.id);"
);

// Remove the entire renderExercises function definition
content = content.replace(
  /const renderExercises = \(\) => \{[\s\S]*?\};\n\n  return \(/,
  "return ("
);

// Replace the call to renderExercises in the JSX
content = content.replace(
  "{renderExercises()}",
  "{internalUserId && <TodayTab patientId={internalUserId} onBookAppointment={() => setIsBookingOpen(true)} />}"
);

fs.writeFileSync('/media/gaurang-rahani/D/Dev/PhysioCare/Frontend/src/features/dashboard/pages/PatientDashboard.jsx', content);
