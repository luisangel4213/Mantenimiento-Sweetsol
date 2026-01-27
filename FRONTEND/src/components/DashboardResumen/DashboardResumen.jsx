import { Link } from 'react-router-dom'
import { Card } from '../Card'
import { ROLES } from '../../constants'
import './DashboardResumen.css'

export const DashboardResumen = ({ role, porEstado, total, completadasHoy }) => {
  const p = porEstado?.pendiente ?? 0
  const ep = porEstado?.en_progreso ?? 0
  const c = porEstado?.completada ?? 0
  const abiertas = p + ep

  if (role === ROLES.JEFE_MANTENIMIENTO) {
    return (
      <Card title="Resumen rápido">
        <p className="dashboard-resumen__p">
          Vista general del taller. <strong>{total}</strong> órdenes en total:
          <strong> {p}</strong> pendientes, <strong>{ep}</strong> en progreso,
          <strong> {c}</strong> completadas.
          {completadasHoy > 0 && (
            <> <strong> {completadasHoy}</strong> completadas hoy.</>
          )}
        </p>
        <div className="dashboard-resumen__links">
          <Link to="/reportes" className="dashboard-resumen__link">Reportes</Link>
          <Link to="/ordenes" className="dashboard-resumen__link">Órdenes</Link>
          <Link to="/equipos" className="dashboard-resumen__link">Equipos</Link>
        </div>
      </Card>
    )
  }

  if (role === ROLES.OPERARIO_MANTENIMIENTO) {
    return (
      <Card title="Resumen rápido">
        <p className="dashboard-resumen__p">
          Tus tareas: <strong>{p}</strong> pendientes, <strong>{ep}</strong> en progreso.
          Ir a Órdenes para trabajar en las asignadas.
        </p>
        <div className="dashboard-resumen__links">
          <Link to="/ordenes" className="dashboard-resumen__link">Órdenes de trabajo</Link>
          <Link to="/equipos" className="dashboard-resumen__link">Equipos</Link>
        </div>
      </Card>
    )
  }

  if (role === ROLES.OPERARIO_PRODUCCION) {
    return (
      <Card title="Resumen rápido">
        <p className="dashboard-resumen__p">
          Estado del mantenimiento que afecta producción: <strong>{abiertas}</strong> órdenes
          abiertas (pendientes + en progreso). Ver detalle en Órdenes.
        </p>
        <div className="dashboard-resumen__links">
          <Link to="/produccion" className="dashboard-resumen__link">Crear solicitud de mantenimiento</Link>
          <Link to="/ordenes" className="dashboard-resumen__link">Ver órdenes</Link>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Resumen rápido">
      <p className="dashboard-resumen__p">
        <strong>{total}</strong> órdenes: {p} pendientes, {ep} en progreso, {c} completadas.
      </p>
      <div className="dashboard-resumen__links">
        <Link to="/ordenes" className="dashboard-resumen__link">Órdenes</Link>
      </div>
    </Card>
  )
}
