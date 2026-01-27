import './Logo.css'

export const Logo = ({ className = '' }) => {
  return (
    <div className={`logo ${className}`}>
      <svg
        viewBox="0 0 240 70"
        xmlns="http://www.w3.org/2000/svg"
        className="logo__svg"
        aria-label="Sweetsol Logo"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Definición de gradiente para el arco amarillo */}
        <defs>
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        {/* Arco amarillo superior con efecto de brillo */}
        <path
          d="M 15 18 Q 60 8 120 10 Q 180 12 225 13"
          stroke="url(#arcGradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          className="logo__arc"
        />
        
        {/* Texto Sweetsol con múltiples capas para el efecto de borde doble */}
        {/* Capa de borde negro (más externa) */}
        <text
          x="120"
          y="52"
          textAnchor="middle"
          className="logo__text logo__text--outline-black"
        >
          Sweetsol
        </text>
        
        {/* Capa de borde azul claro (intermedia) */}
        <text
          x="120"
          y="52"
          textAnchor="middle"
          className="logo__text logo__text--outline-blue"
        >
          Sweetsol
        </text>
        
        {/* Capa principal roja (interior) */}
        <text
          x="120"
          y="52"
          textAnchor="middle"
          className="logo__text logo__text--fill"
        >
          Sweetsol
        </text>
      </svg>
    </div>
  )
}
