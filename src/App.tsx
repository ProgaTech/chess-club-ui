import { Navigate, Route, Routes } from 'react-router-dom'
import { AccountSetup } from '@/components/AccountSetup.tsx'
import { AppHeader } from '@/components/AppHeader.tsx'
import { ClubAccountProvider } from '@/components/ClubAccount.tsx'
import { AnalysisPage } from '@/pages/AnalysisPage'
import { AccountsPage } from '@/pages/AccountsPage.tsx'
import { DrawPage } from '@/pages/DrawPage.tsx'
import { GamesPage } from '@/pages/GamesPage.tsx'
import { HomePage } from '@/pages/HomePage.tsx'
import { MembersPage } from '@/pages/MembersPage.tsx'
import { PlayerPage } from '@/pages/PlayerPage.tsx'
import { RulesPage } from '@/pages/RulesPage.tsx'
import { SignInPage } from '@/pages/SignInPage.tsx'
import { SignUpPage } from '@/pages/SignUpPage.tsx'

function App() {
  return (
    <ClubAccountProvider>
      <div className="min-h-svh">
        <AppHeader />
        <AccountSetup />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/players/:name" element={<PlayerPage />} />
          <Route path="/me" element={<AccountsPage />} />
          <Route path="/accounts" element={<Navigate to="/me" replace />} />
          <Route path="/draw" element={<DrawPage />} />
          <Route path="/analysis/:id?" element={<AnalysisPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
        </Routes>
      </div>
    </ClubAccountProvider>
  )
}

export default App
