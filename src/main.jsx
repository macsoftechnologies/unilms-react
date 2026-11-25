import './unilms/utils/date.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './unilms/career.css'
import './unilms/pages/lms/lms.css'
import AppRoutes from './unilms/AppRoutes.jsx'
import { TenantProvider } from './unilms/context/TenantContext.jsx'
import { AuthProvider } from './unilms/context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TenantProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TenantProvider>
  </StrictMode>,
)
