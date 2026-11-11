import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminAdjustment } from "./pages/AdminAdjustment";
import { AdminAudit } from "./pages/AdminAudit";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminPublicity } from "./pages/AdminPublicity";
import { AdminQuota } from "./pages/AdminQuota";
import { InterviewerOverview, InterviewerRecords, InterviewerScoring } from "./pages/InterviewerWorkspace";
import { LabCandidates, LabOverview, LabQuota } from "./pages/LabWorkspace";
import { LeaderExceptions, LeaderOverview, LeaderPublicity } from "./pages/LeaderWorkspace";
import { MentorCandidates } from "./pages/MentorCandidates";
import { MentorDashboard } from "./pages/MentorDashboard";
import { MentorInterviews } from "./pages/MentorInterviews";
import { StudentApplication } from "./pages/StudentApplication";
import { StudentOverview } from "./pages/StudentOverview";
import { StudentResults } from "./pages/StudentResults";
import { StudentStatus } from "./pages/StudentStatus";
import { StudentUnits } from "./pages/StudentUnits";
import { SystemAudit, SystemDatabase, SystemOverview, SystemUsers } from "./pages/SystemWorkspace";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/student" replace />} />

        <Route path="student">
          <Route index element={<StudentOverview />} />
          <Route path="units" element={<StudentUnits />} />
          <Route path="application" element={<StudentApplication />} />
          <Route path="status" element={<StudentStatus />} />
          <Route path="results" element={<StudentResults />} />
        </Route>

        <Route path="mentor">
          <Route index element={<MentorDashboard />} />
          <Route path="interviews" element={<MentorInterviews />} />
          <Route path="candidates" element={<MentorCandidates />} />
        </Route>

        <Route path="interviewer">
          <Route index element={<InterviewerOverview />} />
          <Route path="scoring" element={<InterviewerScoring />} />
          <Route path="records" element={<InterviewerRecords />} />
        </Route>

        <Route path="lab">
          <Route index element={<LabOverview />} />
          <Route path="quota" element={<LabQuota />} />
          <Route path="candidates" element={<LabCandidates />} />
        </Route>

        <Route path="admin">
          <Route index element={<AdminDashboard />} />
          <Route path="quota" element={<AdminQuota />} />
          <Route path="adjustment" element={<AdminAdjustment />} />
          <Route path="publicity" element={<AdminPublicity />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>

        <Route path="leader">
          <Route index element={<LeaderOverview />} />
          <Route path="exceptions" element={<LeaderExceptions />} />
          <Route path="publicity" element={<LeaderPublicity />} />
        </Route>

        <Route path="system">
          <Route index element={<SystemOverview />} />
          <Route path="users" element={<SystemUsers />} />
          <Route path="database" element={<SystemDatabase />} />
          <Route path="audit" element={<SystemAudit />} />
        </Route>

        <Route path="*" element={<Navigate to="/student" replace />} />
      </Route>
    </Routes>
  );
}
