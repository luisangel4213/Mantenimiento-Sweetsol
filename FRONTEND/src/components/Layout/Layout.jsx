import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth, useMantenimiento } from '../../context'
import { ROLES } from '../../constants'
import { useMediaQuery } from '../../hooks'
import { Header } from '../Header'
import { Sidebar } from '../Sidebar'
import './Layout.css'

const DRAWER_BREAKPOINT = '(max-width: 1023px)'
const NOTIFICACIONES_POLL_INTERVAL_MS = 10000

export const Layout = () => {
  const { user } = useAuth()
  const { fetchOrdenes } = useMantenimiento()
  const isDrawer = useMediaQuery(DRAWER_BREAKPOINT)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => setSidebarOpen((o) => !o)
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), [])

  useEffect(() => {
    if (!isDrawer || !sidebarOpen) return
    const onEscape = (e) => e.key === 'Escape' && handleCloseSidebar()
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [isDrawer, sidebarOpen, handleCloseSidebar])

  // Actualizar órdenes automáticamente para Jefe de Mantenimiento y Super Usuario (nuevas solicitudes sin recargar)
  useEffect(() => {
    const puedeVerNotificaciones = user?.role === ROLES.JEFE_MANTENIMIENTO || user?.role === ROLES.SUPER_USUARIO
    if (!puedeVerNotificaciones) return
    fetchOrdenes().catch(() => {})
    const interval = setInterval(() => {
      fetchOrdenes().catch(() => {})
    }, NOTIFICACIONES_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [user?.role, fetchOrdenes])

  return (
    <div className="layout">
      <Header
        onMenuClick={handleMenuClick}
        showMenuButton={isDrawer}
      />
      <div className="layout__body">
        <div
          className={`layout__overlay ${isDrawer && sidebarOpen ? 'layout__overlay--visible' : ''}`}
          onClick={handleCloseSidebar}
          role="presentation"
        />
        <Sidebar
          isOpen={isDrawer ? sidebarOpen : true}
          onClose={handleCloseSidebar}
        />
        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
