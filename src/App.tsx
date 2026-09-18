import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { NewVerificationPage } from './pages/NewVerificationPage';
import { VerificationResultPage } from './pages/VerificationResultPage';
import { IdentityGraphPage } from './pages/IdentityGraphPage';
import { AuditPage } from './pages/AuditPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="verification/new" element={<NewVerificationPage />} />
          <Route path="verification/:id" element={<VerificationResultPage />} />
          <Route path="identity-graph" element={<IdentityGraphPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
