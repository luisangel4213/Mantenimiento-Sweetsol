import { useState, useMemo, useRef } from 'react'
import { useAuth, useMantenimiento } from '../../context'
import { ROLES, ROLES_LABEL } from '../../constants'
import { Logo } from '../Logo'
import './Header.css'

export const Header = ({ onMenuClick, showMenuButton = false }) => {
  const { user, logout } = useAuth()
  const { ordenes } = useMantenimiento()
  const [showNotifications, setShowNotifications] = useState(false)
  const readUpToRef = useRef(0)

  const displayName = user?.nombre || user?.email || 'Usuario'

  let roleLabel = null
  if (user?.role) {
    // Nombre por defecto según rol
    roleLabel = ROLES_LABEL[user.role] || null

    // Ajustes específicos por usuario
    if (user.role === ROLES.OPERARIO_PRODUCCION) {
      // Distinción entre Producción y Calidad
      if (user.usuario === 'produccion') {
        roleLabel = 'Producción'
      } else if (user.usuario === 'calidad') {
        roleLabel = 'Tec Calidad'
      }
    }
  }

  const isCoordinador = user?.role === ROLES.JEFE_MANTENIMIENTO || user?.role === ROLES.SUPER_USUARIO

  const notifications = useMemo(() => {
    if (!isCoordinador || !ordenes) return []
    return ordenes
      .map((o) => {
        const idText = `Orden #${o.id ?? ''}`.trim()
        if (o.estado === 'en_progreso') {
          return {
            id: `en_curso-${o.id}`,
            ordenId: o.id,
            text: `${idText} en curso por ${o.asignadoANombre || 'Técnico MTTO'}`,
          }
        }
        if (o.estado === 'completada') {
          return {
            id: `completada-${o.id}`,
            ordenId: o.id,
            text: `${idText} finalizada por ${o.asignadoANombre || 'Técnico MTTO'}`,
          }
        }
        if (o.estado === 'pendiente') {
          return {
            id: `nueva-${o.id}`,
            ordenId: o.id,
            text: `${idText} nueva solicitud de mantenimiento`,
          }
        }
        return null
      })
      .filter(Boolean)
  }, [isCoordinador, ordenes])

  const unreadCount = Math.max(0, notifications.length - readUpToRef.current)

  const handleOpenPanel = () => {
    setShowNotifications((v) => {
      const next = !v
      if (next) readUpToRef.current = notifications.length
      return next
    })
  }

  return (
    <header className="header">
      <div className="header__left">
        {showMenuButton && (
          <button
            type="button"
            className="header__menu-btn"
            onClick={onMenuClick}
            aria-label="Abrir menú"
            aria-expanded={false}
          >
            <span className="header__menu-icon" aria-hidden />
          </button>
        )}
        <div className="header__brand">
          <Logo />
          <span className="header__subtitle">Mantenimiento Industrial</span>
        </div>
      </div>

      <div className="header__user">
        {isCoordinador && (
          <div className="header__notifications">
            <button
              type="button"
              className="header__notifications-btn"
              onClick={handleOpenPanel}
              aria-label="Ver notificaciones"
            >
              🔔
              {unreadCount > 0 && (
                <span className="header__notifications-badge">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="header__notifications-panel">
                <div className="header__notifications-header">
                  <span>Notificaciones</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="header__notifications-empty">
                    Sin notificaciones.
                  </p>
                ) : (
                  <ul className="header__notifications-list">
                    {notifications.map((n) => (
                      <li key={n.id} className="header__notifications-item">
                        {n.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
        <div className="header__user-info">
          <span className="header__name" title={displayName}>{displayName}</span>
          {roleLabel && <span className="header__role">{roleLabel}</span>}
        </div>
        <button type="button" className="header__logout" onClick={logout}>
          Salir
        </button>
      </div>
    </header>
  )
}
