import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context'
import { NAV_ITEMS } from '../../constants'
import { NavIcon } from './NavIcon'
import './Sidebar.css'

export const Sidebar = ({ isOpen = true, onClose }) => {
  const { hasAnyRole } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || hasAnyRole(item.roles)
  )

  const handleLinkClick = () => {
    onClose?.()
  }

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <nav className="sidebar__nav" aria-label="Menú principal">
        {visibleItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            end={to === '/'}
            onClick={handleLinkClick}
          >
            <NavIcon name={icon} />
            <span className="sidebar__label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
