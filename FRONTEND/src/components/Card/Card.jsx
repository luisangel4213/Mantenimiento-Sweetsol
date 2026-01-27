import './Card.css'

export const Card = ({ title, children, className = '' }) => {
  return (
    <section className={`card ${className}`.trim()}>
      {title && <h2 className="card__title">{title}</h2>}
      <div className="card__content">{children}</div>
    </section>
  )
}
