import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ApiErrorProvider, MantenimientoProvider } from './context'
import { Layout, ProtectedRoute } from './components'
import { Dashboard, Ordenes, OrdenDetalle, Equipos, Reportes, InformeTecnico, Login, Produccion, ReporteOrdenTrabajo, Operarios } from './pages'
import { ROUTE_ROLES, INFORME_TECNICO_ROLES } from './constants'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <ApiErrorProvider>
        <MantenimientoProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ordenes" element={<Ordenes />} />
                <Route path="/ordenes/:id" element={<OrdenDetalle />} />
                <Route
                  path="/produccion"
                  element={
                    <ProtectedRoute roles={ROUTE_ROLES['/produccion']}>
                      <Produccion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/equipos"
                  element={
                    <ProtectedRoute roles={ROUTE_ROLES['/equipos']}>
                      <Equipos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes"
                  element={
                    <ProtectedRoute roles={ROUTE_ROLES['/reportes']}>
                      <Reportes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operarios"
                  element={
                    <ProtectedRoute roles={ROUTE_ROLES['/operarios']}>
                      <Operarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes/informe/:ordenId"
                  element={
                    <ProtectedRoute roles={INFORME_TECNICO_ROLES}>
                      <InformeTecnico />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes/orden-trabajo/:ordenId"
                  element={
                    <ProtectedRoute roles={ROUTE_ROLES['/reportes']}>
                      <ReporteOrdenTrabajo />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </MantenimientoProvider>
      </ApiErrorProvider>
    </AuthProvider>
  )
}

export default App
