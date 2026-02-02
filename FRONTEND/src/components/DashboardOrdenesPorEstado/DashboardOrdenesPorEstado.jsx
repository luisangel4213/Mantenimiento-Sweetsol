import { Card } from '../Card'
import { Loader } from '../Loader'
import { ESTADOS_ORDEN_VISIBLE, ESTADOS_ORDEN_LABEL } from '../../constants'
import { contarOrdenesPorEstado } from '../../utils'
import './DashboardOrdenesPorEstado.css'

const ESTADO_CLASS = {
  pendiente: 'dashboard-estado--pendiente',
  en_progreso: 'dashboard-estado--en-progreso',
  completada: 'dashboard-estado--completada',
  proceso_cerrado: 'dashboard-estado--proceso-cerrado',
  cancelada: 'dashboard-estado--cancelada',
}

export const DashboardOrdenesPorEstado = ({ ordenes, loading }) => {
  const porEstado = contarOrdenesPorEstado(ordenes)

  return (
    <Card title="Órdenes por estado">
      {loading ? (
        <Loader />
      ) : (
        <div className="dashboard-estado">
          {ESTADOS_ORDEN_VISIBLE.map((estado) => (
            <div
              key={estado}
              className={`dashboard-estado__item ${ESTADO_CLASS[estado] || ''}`}
            >
              <span className="dashboard-estado__label">
                {ESTADOS_ORDEN_LABEL[estado]}
              </span>
              <span className="dashboard-estado__num">{porEstado[estado] ?? 0}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
