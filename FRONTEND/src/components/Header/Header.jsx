import { useAuth } from '../../context'
import { ROLES_LABEL } from '../../constants'
import { Logo } from '../Logo'
import './Header.css'

export const Header = ({ onMenuClick, showMenuButton = false }) => {
  const { user, logout } = useAuth()

  const displayName = user?.nombre || user?.email || 'Usuario'
  const roleLabel = user?.role ? ROLES_LABEL[user.role] : null

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
