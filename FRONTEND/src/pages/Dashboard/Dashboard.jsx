import { useEffect } from 'react'
import { useAuth, useMantenimiento } from '../../context'
import { ROLES, ROLES_LABEL } from '../../constants'
import { contarOrdenesPorEstado, completadasHoy } from '../../utils'
import { DashboardOrdenesPorEstado, DashboardResumen } from '../../components'
import './Dashboard.css'

const TITULO_POR_ROL = {
  [ROLES.JEFE_MANTENIMIENTO]: 'Vista general del taller',
  [ROLES.SUPER_USUARIO]: 'Vista general del taller',
  [ROLES.OPERARIO_MANTENIMIENTO]: 'Tus tareas de mantenimiento',
  [ROLES.OPERARIO_PRODUCCION]: 'Mantenimiento y producción',
}

export const Dashboard = () => {
  const { user } = useAuth()
  const { ordenes, loading, fetchOrdenes } = useMantenimiento()

  useEffect(() => {
    fetchOrdenes().catch(() => {})
  }, [fetchOrdenes])

  const porEstado = contarOrdenesPorEstado(ordenes)
  const total = ordenes?.length ?? 0
  const hoy = completadasHoy(ordenes)

  const nombre = user?.nombre || user?.email || ''
  const rol = user?.role
  const titulo = (rol && TITULO_POR_ROL[rol]) || 'Dashboard'

  let rolLabel = null
  if (rol) {
    rolLabel = ROLES_LABEL[rol] || null
    // Ajustes específicos por usuario (igual que en Header)
    if (rol === ROLES.OPERARIO_PRODUCCION) {
      if (user?.usuario === 'produccion') {
        rolLabel = 'Producción'
      } else if (user?.usuario === 'calidad') {
        rolLabel = 'Tec Calidad'
      }
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="page-title">Dashboard</h1>
        {nombre && <p className="dashboard__greeting">Hola, {nombre}</p>}
        {rolLabel && <p className="dashboard__rol">{titulo} · {rolLabel}</p>}
      </div>

      <DashboardOrdenesPorEstado ordenes={ordenes} loading={loading} />

      <DashboardResumen
        role={rol}
        porEstado={porEstado}
        total={total}
        completadasHoy={hoy}
      />
    </div>
  )
}
