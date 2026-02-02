import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context'
import { ROLES, ESTADOS_ORDEN } from '../../constants'
import { Card, Loader, FirmaCanvas } from '../../components'
import { exportarOrdenTrabajoPDF, exportarInformePDF, exportarInformeExcel } from '../../utils'
import { mantenimientoService } from '../../services'
import './InformeTecnico.css'

export const InformeTecnico = () => {
  const { ordenId } = useParams()
  const { user, hasRole } = useAuth()

  const [orden, setOrden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firma, setFirma] = useState(null)
  const [firmaEncargado, setFirmaEncargado] = useState(null)
  
  const esJefe = hasRole(ROLES.JEFE_MANTENIMIENTO)

  useEffect(() => {
    if (!ordenId) return
    setLoading(true)
    mantenimientoService
      .getOrdenById(ordenId)
      .then((r) => setOrden(r.data))
      .catch(() => setOrden(null))
      .finally(() => setLoading(false))
  }, [ordenId])

  if (loading) {
    return (
      <div className="informe-tecnico">
        <Loader />
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="informe-tecnico">
        <p className="informe-tecnico__error">No se encontró la orden.</p>
        <Link to="/ordenes">Volver a órdenes</Link>
      </div>
    )
  }

  // Solo órdenes en Proceso cerrado pueden acceder al Informe Técnico
  if (orden.estado !== ESTADOS_ORDEN.PROCESO_CERRADO) {
    return (
      <div className="informe-tecnico">
        <p className="informe-tecnico__error">
          Solo las órdenes en estado <strong>Proceso cerrado</strong> pueden generar o consultar el Informe Técnico de Mantenimiento. Esta orden está en estado &quot;{orden.estado || 'desconocido'}&quot;.
        </p>
        <Link to="/ordenes">Volver a órdenes</Link>
      </div>
    )
  }

  const evidencias = Array.isArray(orden.evidencias) ? orden.evidencias : []
  const generadoPor = user?.nombre || user?.email || ''
  const tieneDatosReporte = orden?.datosReporte != null

  // Extraer área y máquina de la descripción
  const extraerAreaMaquina = (descripcion) => {
    if (!descripcion) return { area: '', maquina: '' }
    const lines = descripcion.split('\n')
    let area = ''
    let maquina = ''
    lines.forEach((line) => {
      if (line.startsWith('Área:')) area = line.replace('Área:', '').trim()
      if (line.startsWith('Máquina:')) maquina = line.replace('Máquina:', '').trim()
    })
    return { area, maquina }
  }

  const { area, maquina } = extraerAreaMaquina(orden?.descripcion)

  const handlePDF = async () => {
    if (tieneDatosReporte) {
      const firmas = orden.datosReporte.firmas || {}
      await exportarOrdenTrabajoPDF(
        orden,
        orden.datosReporte,
        firmas.ejecutante || null,
        firmas.solicitante || null,
        firmaEncargado || firmas.encargado || null
      )
    } else {
      exportarInformePDF(orden, firma, generadoPor)
    }
  }

  const handleExcel = () => {
    exportarInformeExcel(orden, null, generadoPor)
  }

  return (
    <div className="informe-tecnico">
      <div className="informe-tecnico__header">
        <Link to="/ordenes" className="informe-tecnico__back">← Volver</Link>
        <h1 className="page-title">Informe técnico de mantenimiento</h1>
        <p className="informe-tecnico__orden">Orden #{orden.id}</p>
      </div>

      {tieneDatosReporte ? (
        <>
          <Card title="Orden de Trabajo Completa">
            <p className="informe-tecnico__info">
              Esta orden fue completada por el operario de mantenimiento. A continuación se muestra el reporte completo tal como fue guardado.
            </p>
          </Card>

          <Card title="1. FECHAS">
            <dl className="informe-tecnico__resumen">
              <div className="informe-tecnico__row">
                <dt>Prioridad</dt>
                <dd>{orden.prioridad === 'alta' ? 'Alta' : orden.prioridad === 'media' ? 'Media' : 'Baja'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Fecha Inicio</dt>
                <dd>{orden.fechaInicio ? new Date(orden.fechaInicio).toLocaleDateString('es-CO') : '—'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Fecha Fin</dt>
                <dd>{orden.fechaCierre ? new Date(orden.fechaCierre).toLocaleDateString('es-CO') : '—'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Fecha Impresión</dt>
                <dd>{new Date().toLocaleDateString('es-CO')}</dd>
              </div>
            </dl>
          </Card>

          <Card title="2. DATOS DEL OBJETO">
            <dl className="informe-tecnico__resumen">
              <div className="informe-tecnico__row">
                <dt>Cod Equipo</dt>
                <dd>{orden.equipoId || '—'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Descrip Equip</dt>
                <dd>{maquina || '—'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Emplazamiento</dt>
                <dd>{orden.datosReporte.emplazamiento || '—'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Área</dt>
                <dd>{area || '—'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Ubicación técnica</dt>
                <dd>{orden.datosReporte.ubicacionTecnica || '—'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Grupo planificador</dt>
                <dd>{orden.datosReporte.grupoPlanificador || 'Producción'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Resp. Pto Triba</dt>
                <dd>{orden.datosReporte.responsablePtoTriba || 'Mantenimiento'}</dd>
              </div>
              <div className="informe-tecnico__row">
                <dt>Responsable</dt>
                <dd>{orden.datosReporte.responsable1 || orden.asignadoANombre || '—'}</dd>
              </div>
            </dl>
          </Card>

          {(orden.datosReporte.descripcionAdicional || '').trim() && (
            <Card title="3. Descripción adicional (Instrucciones del Jefe de Mantenimiento)">
              <pre className="informe-tecnico__observaciones-text" style={{ whiteSpace: 'pre-wrap' }}>
                {orden.datosReporte.descripcionAdicional.trim()}
              </pre>
            </Card>
          )}

          {orden.datosReporte.operacionesPlaneadas && orden.datosReporte.operacionesPlaneadas.length > 0 && (
            <Card title="4. OPERACIONES PLANEADAS">
              <div className="informe-tecnico__table-wrapper">
                <table className="informe-tecnico__table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Puesto Trabajo</th>
                      <th>Descripción</th>
                      <th>Cant. Personas</th>
                      <th>Horas Trabajo</th>
                      <th>Hora Inicio</th>
                      <th>Hora Fin</th>
                      <th>Horas Reales</th>
                      <th>Ejecutó</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.datosReporte.operacionesPlaneadas.map((op, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{op.puestoTrabajo || '—'}</td>
                        <td>{op.descripcion || '—'}</td>
                        <td>{op.cantPersonas || '—'}</td>
                        <td>{op.horasTrabajo || '—'}</td>
                        <td>{op.horaInicio || '—'}</td>
                        <td>{op.horaFin || '—'}</td>
                        <td>{op.horasReales || '—'}</td>
                        <td>{op.ejecuto ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {orden.datosReporte.operacionesNoPlaneadas && orden.datosReporte.operacionesNoPlaneadas.length > 0 && (
            <Card title="5. OP EJECUTADAS NO PLANEADAS">
              <div className="informe-tecnico__table-wrapper">
                <table className="informe-tecnico__table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Descripción</th>
                      <th>Hora I</th>
                      <th>Hora F</th>
                      <th>Horas R</th>
                      <th>Ejecutó</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.datosReporte.operacionesNoPlaneadas.map((op, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{op.descripcion || '—'}</td>
                        <td>{op.horaInicio || '—'}</td>
                        <td>{op.horaFin || '—'}</td>
                        <td>{op.horasReales || '—'}</td>
                        <td>{op.ejecuto ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {orden.datosReporte.repuestos && orden.datosReporte.repuestos.length > 0 && (
            <Card title="6. Repuestos utilizados">
              <div className="informe-tecnico__table-wrapper">
                <table className="informe-tecnico__table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Cant.</th>
                      <th>Tipo Posición</th>
                      <th>Documento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.datosReporte.repuestos.map((rep, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{rep.codigo || '—'}</td>
                        <td>{rep.descripcion || '—'}</td>
                        <td>{rep.cantidad || '—'}</td>
                        <td>{rep.tipoPosicion || '—'}</td>
                        <td>{rep.documento || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card title="7. OBSERVACIONES">
            <div className="informe-tecnico__observaciones">
              {orden.datosReporte.observaciones ? (
                <pre className="informe-tecnico__observaciones-text">{orden.datosReporte.observaciones}</pre>
              ) : (
                <p className="informe-tecnico__empty">No hay observaciones registradas.</p>
              )}
            </div>
          </Card>

          <Card title="8. FIRMAS">
            <div className="informe-tecnico__firmas">
              <div className="informe-tecnico__firma-item">
                <h4>Ejecutante</h4>
                <p><strong>Nombre:</strong> {orden.datosReporte.ejecutanteNombre || '—'}</p>
                <p><strong>Fecha:</strong> {orden.datosReporte.ejecutanteFecha || '—'}</p>
                {orden.datosReporte.firmas?.ejecutante && (
                  <div className="informe-tecnico__firma-img">
                    <img src={orden.datosReporte.firmas.ejecutante} alt="Firma ejecutante" />
                  </div>
                )}
              </div>

              <div className="informe-tecnico__firma-item">
                <h4>Cliente interno (solicitante)</h4>
                <p><strong>Nombre:</strong> {orden.datosReporte.solicitanteNombre || '—'}</p>
                <p><strong>Fecha:</strong> {orden.datosReporte.solicitanteFecha || '—'}</p>
                {orden.datosReporte.firmas?.solicitante && (
                  <div className="informe-tecnico__firma-img">
                    <img src={orden.datosReporte.firmas.solicitante} alt="Firma solicitante" />
                  </div>
                )}
              </div>

              <div className="informe-tecnico__firma-item">
                <h4>Firma Encargado Mantenimiento</h4>
                <p><strong>Fecha:</strong> {orden.datosReporte.encargadoFecha || new Date().toISOString().split('T')[0]}</p>
                {firmaEncargado ? (
                  <div className="informe-tecnico__firma-img">
                    <img src={firmaEncargado} alt="Firma encargado" />
                  </div>
                ) : orden.datosReporte.firmas?.encargado ? (
                  <div className="informe-tecnico__firma-img">
                    <img src={orden.datosReporte.firmas.encargado} alt="Firma encargado" />
                  </div>
                ) : null}
                {esJefe && (
                  <div className="informe-tecnico__firma-canvas">
                    <p className="informe-tecnico__firma-text">
                      {firmaEncargado ? 'Firma agregada. Puede volver a firmar para actualizarla.' : 'Firme en el recuadro. La firma se incluirá en el PDF.'}
                    </p>
                    <FirmaCanvas onChange={setFirmaEncargado} width={300} height={120} />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card title="Vista resumen">
          <dl className="informe-tecnico__resumen">
            <div className="informe-tecnico__row">
              <dt>Orden</dt>
              <dd>#{orden.id}</dd>
            </div>
            <div className="informe-tecnico__row">
              <dt>Fecha</dt>
              <dd>{new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</dd>
            </div>
            <div className="informe-tecnico__row">
              <dt>Descripción</dt>
              <dd>{orden.titulo || orden.descripcion || '—'}</dd>
            </div>
            <div className="informe-tecnico__row">
              <dt>Trabajo realizado</dt>
              <dd>{orden.trabajoRealizado || '—'}</dd>
            </div>
          </dl>
        </Card>
      )}

      <Card title="Evidencias">
        {evidencias.length === 0 ? (
          <p className="informe-tecnico__empty">No hay evidencias.</p>
        ) : (
          <div className="informe-tecnico__evidencias">
            {evidencias.map((e, i) => {
              const item = typeof e === 'string' ? { url: e, nombre: `Evidencia ${i + 1}` } : e
              const url = item.url || (typeof e === 'string' ? e : '')
              const esImagen = /\.(jpe?g|png|gif|webp)$/i.test(url) || (item.type && item.type.startsWith('image/'))
              return (
                <div key={i} className="informe-tecnico__ev-item">
                  {esImagen && url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="informe-tecnico__ev-img-wrap">
                      <img src={url} alt={item.nombre || `Evidencia ${i + 1}`} className="informe-tecnico__ev-img" />
                    </a>
                  ) : null}
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="informe-tecnico__ev-link">
                      {item.nombre || url || `Evidencia ${i + 1}`}
                    </a>
                  ) : (
                    <span className="informe-tecnico__ev-link">{item.nombre || `Evidencia ${i + 1}`}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {!tieneDatosReporte && (
        <Card title="Firma">
          <p className="informe-tecnico__firma-text">Firme en el recuadro. La firma se incluirá en el PDF.</p>
          <FirmaCanvas onChange={setFirma} width={380} height={160} />
        </Card>
      )}

      <Card title="Exportar">
        <div className="informe-tecnico__export">
          <button type="button" className="informe-tecnico__btn informe-tecnico__btn--pdf" onClick={handlePDF}>
            {tieneDatosReporte ? 'Descargar PDF de Orden de Trabajo' : 'Exportar PDF'}
          </button>
          {!tieneDatosReporte && (
            <button type="button" className="informe-tecnico__btn informe-tecnico__btn--excel" onClick={handleExcel}>
              Exportar Excel
            </button>
          )}
        </div>
        {tieneDatosReporte && (
          <p className="informe-tecnico__info-export">
            El PDF se generará con todos los datos completados por el operario de mantenimiento, incluyendo operaciones, repuestos, observaciones y firmas.
          </p>
        )}
      </Card>
    </div>
  )
}
