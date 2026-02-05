import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ——— Constantes de diseño corporativo (Orden de Trabajo) ———
const MARGIN = 14
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const HEADER_HEIGHT = 30
const BODY_START_Y = HEADER_HEIGHT + 6
const FOOTER_Y = 279
const BODY_MAX_Y = FOOTER_Y - 12
const LOGO_WIDTH = 24
const LOGO_HEIGHT = 10
const FONT_SIZE = 9
const FONT_SIZE_TABLAS = 8
const CELL_PADDING = 2
const ROW_HEIGHT_COMPACT = 4
const NOMBRE_EMPRESA = 'SWEETSOL'
const TITULO_ORDEN = 'SOLICITUD DE MANTENIMIENTO'
const NOMBRE_SISTEMA = 'Sistema de Mantenimiento SweetSol'

/**
 * Carga el logo desde /logo-sweetsol.png y devuelve base64 o null.
 * @returns {Promise<string|null>}
 */
function cargarLogoBase64() {
  return fetch('/logo-sweetsol.png')
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('Logo no encontrado'))))
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
    )
    .catch(() => null)
}

/**
 * Dibuja el encabezado institucional en cada página del PDF de Orden de Trabajo.
 * Logo (izquierda), SWEETSOL, título centrado, OT N°, tipo, fecha impresión.
 */
function drawHeaderOrdenTrabajo(doc, opts) {
  const { logoBase64, numeroOrden, tipoOrden, fechaImpresion } = opts
  doc.setDrawColor(220, 220, 220)
  doc.setFillColor(252, 252, 252)
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'FD')
  doc.setDrawColor(180, 180, 180)
  doc.line(MARGIN, HEADER_HEIGHT, PAGE_WIDTH - MARGIN, HEADER_HEIGHT)

  let xRight = MARGIN
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', MARGIN, 6, LOGO_WIDTH, LOGO_HEIGHT)
      xRight = MARGIN + LOGO_WIDTH + 6
    } catch (e) {
      // ignorar si falla la imagen
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FONT_SIZE)
  doc.setTextColor(40, 40, 40)
  doc.text(NOMBRE_EMPRESA, xRight, 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE)
  doc.setTextColor(0, 0, 0)
  doc.text(TITULO_ORDEN, PAGE_WIDTH / 2, 18, { align: 'center' })
  doc.setFontSize(FONT_SIZE)
  doc.setTextColor(60, 60, 60)
  const linea3 = `OT N° ${numeroOrden}  |  Tipo: ${tipoOrden || 'Orden de mantenimiento'}  |  Fecha impresión: ${fechaImpresion}`
  doc.text(linea3, PAGE_WIDTH / 2, 25, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

/**
 * Dibuja el pie de página (Página X de Y, fecha/hora, sistema).
 */
function drawFooterOrdenTrabajo(doc, pageNumber, pageCount, fechaHoraGeneracion) {
  doc.setDrawColor(220, 220, 220)
  doc.line(MARGIN, FOOTER_Y - 2, PAGE_WIDTH - MARGIN, FOOTER_Y - 2)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Página ${pageNumber} de ${pageCount}  |  ${fechaHoraGeneracion}  |  ${NOMBRE_SISTEMA}`,
    PAGE_WIDTH / 2,
    FOOTER_Y + 4,
    { align: 'center' }
  )
  doc.setTextColor(0, 0, 0)
}

/**
 * Si no hay espacio suficiente, añade nueva página y dibuja encabezado.
 * @returns {number} Nueva posición y
 */
function ensureSpace(doc, y, headerOpts) {
  if (y > BODY_MAX_Y) {
    doc.addPage()
    drawHeaderOrdenTrabajo(doc, headerOpts)
    return BODY_START_Y
  }
  return y
}

/** Dibuja solo el borde exterior de la última tabla (sin líneas internas). */
function drawTableOuterBorder(doc, tableStartY) {
  const t = doc.lastAutoTable
  if (!t || t.finalY == null) return
  const startY = tableStartY != null ? Number(tableStartY) : Number(t.startY)
  const endY = Number(t.finalY)
  const y = startY
  const h = endY - startY
  const w = PAGE_WIDTH - 2 * MARGIN
  if (!Number.isFinite(y) || !Number.isFinite(h) || h <= 0 || !Number.isFinite(w) || w <= 0) return
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN, y, w, h)
}

/** Extrae área, máquina, tipo M, solicitante y descripción real del texto de descripción. */
function extraerInfoDescripcion(descripcion) {
  if (!descripcion) return { area: '', maquina: '', tipoM: '', descripcionReal: '', solicitanteNombre: '' }
  const lines = descripcion.split('\n')
  let area = ''
  let maquina = ''
  let tipoM = ''
  let solicitanteNombre = ''
  let descripcionReal = ''
  let indiceFinMetadatos = -1
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t.startsWith('Área:')) area = t.replace('Área:', '').trim()
    else if (t.startsWith('Máquina:')) maquina = t.replace('Máquina:', '').trim()
    else if (t.startsWith('Tipo M:')) tipoM = t.replace('Tipo M:', '').trim()
    else if (t.startsWith('Solicitante:')) solicitanteNombre = t.replace('Solicitante:', '').trim()
    else if (t.startsWith('Datos:')) {
      if (i + 1 < lines.length && lines[i + 1].trim() === '') {
        indiceFinMetadatos = i + 1
        break
      }
    }
  }
  if (indiceFinMetadatos === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('Solicitante:') && i + 1 < lines.length && lines[i + 1].trim() === '') {
        indiceFinMetadatos = i + 1
        break
      }
    }
  }
  if (indiceFinMetadatos >= 0 && indiceFinMetadatos + 1 < lines.length) {
    descripcionReal = lines.slice(indiceFinMetadatos + 1).map((l) => l.trim()).filter(Boolean).join('\n').trim()
  }
  return { area, maquina, tipoM, descripcionReal, solicitanteNombre }
}

/**
 * Genera y descarga el PDF de Orden de Trabajo (Orden de Mantenimiento Final).
 * Diseño corporativo: encabezado con logo en todas las páginas, tablas estructuradas, pie de página.
 * @param {Object} orden - Orden completa
 * @param {Object} [datosReporte] - Datos del reporte (opcional si orden.datosReporte existe)
 * @param {string|null} [firmaEjecutante] - Base64 firma ejecutante
 * @param {string|null} [firmaSolicitante] - Base64 firma cliente interno
 * @param {string|null} [firmaEncargado] - Base64 firma encargado
 * @param {{ logoBase64?: string }} [opciones] - logoBase64 opcional para no cargar desde /logo-sweetsol.png
 */
export async function exportarOrdenTrabajoPDF(
  orden,
  datosReporte,
  firmaEjecutante,
  firmaSolicitante,
  firmaEncargado,
  opciones = {}
) {
  if (orden.datosReporte) {
    datosReporte = orden.datosReporte
    if (datosReporte.firmas) {
      firmaEjecutante = datosReporte.firmas.ejecutante || firmaEjecutante
      firmaSolicitante = datosReporte.firmas.solicitante || firmaSolicitante
      firmaEncargado = datosReporte.firmas.encargado || firmaEncargado
    }
  }
  if (!datosReporte) datosReporte = {}

  let logoBase64 = opciones.logoBase64 || null
  if (!logoBase64) logoBase64 = await cargarLogoBase64()

  const numeroMatch = orden.titulo?.match(/Nro:\s*(\d+)/i)
  const numeroOrdenRaw = numeroMatch ? numeroMatch[1] : String(orden.id || '')
  const numeroOrden = String(numeroOrdenRaw).padStart(5, '0')
  const tipoOrden =
    datosReporte.tipoOrden ||
    (datosReporte.tipoMantenimiento && datosReporte.tipoMantenimiento.charAt(0).toUpperCase() + datosReporte.tipoMantenimiento.slice(1)) ||
    'Orden de mantenimiento'
  const fechaImpresion = new Date().toLocaleDateString('es-CO')
  const fechaHoraGeneracion = `${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`

  const headerOpts = { logoBase64, numeroOrden, tipoOrden, fechaImpresion }

  const doc = new jsPDF('p', 'mm', 'a4')
  doc.setFont('helvetica')
  doc.setFontSize(FONT_SIZE)

  let y = BODY_START_Y

  const infoDesc = extraerInfoDescripcion(orden.descripcion || '')
  const area = infoDesc.area || '—'
  const maquina = infoDesc.maquina || orden.equipoNombre || '—'
  const tipoM = infoDesc.tipoM || tipoOrden || 'Correctivo'
  const solicitanteNombre = infoDesc.solicitanteNombre || '—'
  const asignadoANombre = orden.asignadoANombre || '—'
  const descripcionTrabajo = infoDesc.descripcionReal || '—'

  const prioridadLabel = { baja: 'Baja', media: 'Media', alta: 'Alta' }
  const prioridad = prioridadLabel[orden.prioridad] || orden.prioridad || '—'
  const fechaSolicitud = orden.createdAt ? new Date(orden.createdAt).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO')
  const fechaInicioEst = orden.fechaInicio ? new Date(orden.fechaInicio).toLocaleDateString('es-CO') : '—'
  const fechaFinEst = orden.fechaCierre ? new Date(orden.fechaCierre).toLocaleDateString('es-CO') : '—'

  drawHeaderOrdenTrabajo(doc, headerOpts)
  y = BODY_START_Y

  // ——— 1. Datos Generales (tabla con cuadrícula, labels en negrita, valores centrados) ———
  doc.setFontSize(FONT_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.text('1. Datos Generales', MARGIN, y)
  y += 4

  const anchoCol = (PAGE_WIDTH - 2 * MARGIN) / 4
  const valorCelda = (v) => (v == null || String(v).trim() === '' || v === '—' ? ' ' : String(v).trim())
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    body: [
      ['Fecha solicitud', valorCelda(fechaSolicitud), 'Prioridad', valorCelda(prioridad)],
      ['Fecha inicio estimada', valorCelda(fechaInicioEst), 'Área', valorCelda(area)],
      ['Fecha fin estimada', valorCelda(fechaFinEst), 'Asignado', valorCelda(asignadoANombre)],
      ['Tipo mantenimiento', valorCelda(tipoM), '', ''],
    ],
    theme: 'grid',
    styles: { lineColor: [207, 207, 207], lineWidth: 0.3 },
    bodyStyles: {
      fontSize: FONT_SIZE_TABLAS,
      cellPadding: CELL_PADDING,
      minCellHeight: 6,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: anchoCol, fontStyle: 'bold' },
      1: { cellWidth: anchoCol, fontStyle: 'normal' },
      2: { cellWidth: anchoCol, fontStyle: 'bold' },
      3: { cellWidth: anchoCol, fontStyle: 'normal' },
    },
  })
  y = doc.lastAutoTable.finalY + 4
  y = ensureSpace(doc, y, headerOpts)

  // ——— 2. Operaciones Planeadas (tabla Área, Máquina, Tipo M, Solicitante) ———
  doc.setFontSize(FONT_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.text('2. Operaciones Planeadas', MARGIN, y)
  y += 4

  const anchoColOps = (PAGE_WIDTH - 2 * MARGIN) / 4
  const valorOps = (v) => (v == null || String(v).trim() === '' || v === '—' ? ' ' : String(v).trim())
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    body: [
      ['Área', valorOps(area), 'Tipo M', valorOps(tipoM)],
      ['Máquina', valorOps(maquina), 'Solicitante', valorOps(solicitanteNombre)],
    ],
    theme: 'grid',
    styles: { lineColor: [207, 207, 207], lineWidth: 0.3 },
    bodyStyles: {
      fontSize: FONT_SIZE_TABLAS,
      cellPadding: CELL_PADDING,
      minCellHeight: 6,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: anchoColOps, fontStyle: 'bold', fillColor: [248, 248, 248] },
      1: { cellWidth: anchoColOps, fontStyle: 'normal' },
      2: { cellWidth: anchoColOps, fontStyle: 'bold', fillColor: [248, 248, 248] },
      3: { cellWidth: anchoColOps, fontStyle: 'normal' },
    },
  })
  y = doc.lastAutoTable.finalY + 4

  // Bloque Descripción del Trabajo | Descripción Adicional (Coordinador MTTO) — 50/50
  const descAdicional = (datosReporte.descripcionAdicional || '').trim()
  const descTrabajoRaw = (descripcionTrabajo || '').trim()
  const descTrabajo = (descTrabajoRaw === '' || descTrabajoRaw === '—') ? ' ' : descTrabajoRaw
  const descAdicionalVal = (descAdicional === '' || descAdicional === '—') ? ' ' : descAdicional

  // Texto que se copiará a la tabla de actividades planeadas (sin numerar, se manejará por filas):
  const textoDescTrabajoTabla = (descTrabajoRaw && descTrabajoRaw !== '—') ? descTrabajoRaw.trim() : ''
  const textoDescAdicionalTabla = (descAdicional && descAdicional !== '—') ? descAdicional.trim() : ''
  const anchoColDesc = (PAGE_WIDTH - 2 * MARGIN) / 2
  const ALTURA_MIN_DESC = 14
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Descripción del Trabajo', 'Descripción Adicional (Coordinador MTTO)']],
    body: [[descTrabajo, descAdicionalVal]],
    theme: 'grid',
    styles: { lineColor: [207, 207, 207], lineWidth: 0.3 },
    headStyles: {
      fontSize: FONT_SIZE_TABLAS,
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fillColor: [248, 248, 248],
      cellPadding: CELL_PADDING,
      valign: 'top',
    },
    bodyStyles: {
      fontSize: FONT_SIZE_TABLAS,
      cellPadding: CELL_PADDING,
      minCellHeight: ALTURA_MIN_DESC,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: anchoColDesc },
      1: { cellWidth: anchoColDesc },
    },
  })
  y = doc.lastAutoTable.finalY + 4
  y = ensureSpace(doc, y, headerOpts)

  // Tabla de actividades planeadas (cuadrícula, proporciones: Ítem 6%, Descripción 44%, Fechas 16%+16%, Horas 18%)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(FONT_SIZE)
  doc.text('Tabla de actividades planeadas', MARGIN, y)
  y += 4
  doc.setFont('helvetica', 'normal')

  const anchoTabla = PAGE_WIDTH - 2 * MARGIN
  const colItem = anchoTabla * 0.06
  const colDesc = anchoTabla * 0.44
  const colFecha = anchoTabla * 0.16
  const colHoras = anchoTabla * 0.18

  const opsPlaneadas = datosReporte.operacionesPlaneadas && datosReporte.operacionesPlaneadas.length > 0
    ? datosReporte.operacionesPlaneadas
    : []

  // Determinar si ya hay descripciones manuales en la tabla
  const hayDescripcionManual = opsPlaneadas.some((op) => (op.descripcion || '').trim() !== '')

  const cuerpoActividades = []

  if (opsPlaneadas.length > 0) {
    // Hay filas definidas desde el formulario
    opsPlaneadas.forEach((op, idx) => {
      let descripcionActividad = (op.descripcion || op.puestoTrabajo || '').replace(/\n/g, ' ').trim() || ''

      // Si NO hay descripción manual en ninguna fila, usamos las descripciones superiores:
      if (!hayDescripcionManual) {
        if (idx === 0 && textoDescTrabajoTabla) {
          descripcionActividad = textoDescTrabajoTabla.replace(/\n/g, ' ').trim()
        } else if (idx === 1 && textoDescAdicionalTabla) {
          descripcionActividad = textoDescAdicionalTabla.replace(/\n/g, ' ').trim()
        }
      }

      cuerpoActividades.push([
        idx + 1,
        descripcionActividad,
        op.horaInicio ? new Date(`2000-01-01T${op.horaInicio}`).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
        op.horaFin ? new Date(`2000-01-01T${op.horaFin}`).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
        op.horasReales || '',
      ])
    })

    // Si solo había una fila y tenemos descripción adicional, agregar una segunda fila automática (ítem 2)
    if (!hayDescripcionManual && opsPlaneadas.length === 1 && textoDescAdicionalTabla) {
      cuerpoActividades.push([
        2,
        textoDescAdicionalTabla.replace(/\n/g, ' ').trim(),
        '',
        '',
        '',
      ])
    }
  } else {
    // No hay filas definidas: crear hasta dos filas (ítems 1 y 2) a partir de las descripciones superiores
    if (textoDescTrabajoTabla) {
      cuerpoActividades.push([
        1,
        textoDescTrabajoTabla.replace(/\n/g, ' ').trim(),
        '',
        '',
        '',
      ])
    }
    if (textoDescAdicionalTabla) {
      cuerpoActividades.push([
        cuerpoActividades.length + 1,
        textoDescAdicionalTabla.replace(/\n/g, ' ').trim(),
        '',
        '',
        '',
      ])
    }
    // Si aun así no hay nada, mantener al menos una fila vacía
    if (cuerpoActividades.length === 0) {
      cuerpoActividades.push([1, '', '', '', ''])
    }
  }

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Ítem', 'Descripción de la Actividad', 'Fecha inicio', 'Fecha fin', 'Horas reales']],
    body: cuerpoActividades,
    theme: 'grid',
    styles: { lineColor: [207, 207, 207], lineWidth: 0.3 },
    headStyles: {
      fontSize: FONT_SIZE_TABLAS,
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fillColor: [248, 248, 248],
      cellPadding: CELL_PADDING,
    },
    bodyStyles: {
      fontSize: FONT_SIZE_TABLAS,
      cellPadding: CELL_PADDING,
      minCellHeight: 7,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: colItem },
      1: { cellWidth: colDesc },
      2: { cellWidth: colFecha },
      3: { cellWidth: colFecha },
      4: { cellWidth: colHoras },
    },
  })
  y = doc.lastAutoTable.finalY + 4
  y = ensureSpace(doc, y, headerOpts)

  // ——— 4. Operaciones ejecutadas no planeadas (tabla con datos reales: Ítem, Descripción, Hora inicio, Hora fin, Horas reales) ———
  doc.setFontSize(FONT_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.text('4. Operaciones Ejecutadas No Planeadas', MARGIN, y)
  y += 4

  doc.setFont('helvetica', 'normal')
  const opsNoPlaneadas = datosReporte.operacionesNoPlaneadas && datosReporte.operacionesNoPlaneadas.length > 0
    ? datosReporte.operacionesNoPlaneadas.filter((op) => (op.descripcion || op.horaInicio || op.horaFin || op.horasReales))
    : []
  const opsNoPlaneadasData = opsNoPlaneadas.map((op, idx) => [
    idx + 1,
    (op.descripcion || '').replace(/\n/g, ' ').trim() || '',
    op.horaInicio ? new Date(`2000-01-01T${op.horaInicio}`).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
    op.horaFin ? new Date(`2000-01-01T${op.horaFin}`).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
    op.horasReales || '',
  ])
  if (opsNoPlaneadasData.length === 0) {
    opsNoPlaneadasData.push([1, '', '', '', ''])
  }

  const anchoTablaNoPlaneadas = PAGE_WIDTH - 2 * MARGIN
  const colItemNoP = anchoTablaNoPlaneadas * 0.06
  const colDescNoP = anchoTablaNoPlaneadas * 0.44
  const colFechaNoP = anchoTablaNoPlaneadas * 0.16
  const colHorasNoP = anchoTablaNoPlaneadas * 0.18

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Ítem', 'Descripción de la Actividad', 'Fecha inicio', 'Fecha fin', 'Horas reales']],
    body: opsNoPlaneadasData,
    theme: 'grid',
    styles: { lineColor: [207, 207, 207], lineWidth: 0.3 },
    headStyles: {
      fontSize: FONT_SIZE_TABLAS,
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fillColor: [248, 248, 248],
      cellPadding: CELL_PADDING,
    },
    bodyStyles: {
      fontSize: FONT_SIZE_TABLAS,
      cellPadding: CELL_PADDING,
      minCellHeight: 7,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: colItemNoP },
      1: { cellWidth: colDescNoP },
      2: { cellWidth: colFechaNoP },
      3: { cellWidth: colFechaNoP },
      4: { cellWidth: colHorasNoP },
    },
  })
  y = doc.lastAutoTable.finalY + 4
  y = ensureSpace(doc, y, headerOpts)

  // ——— 5. Repuestos utilizados (proporciones: Código 20%, Descripción 60%, Cantidad 20%) ———
  doc.setFontSize(FONT_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.text('5. Repuestos utilizados', MARGIN, y)
  y += 4

  doc.setFont('helvetica', 'normal')
  const repuestos = datosReporte.repuestos && datosReporte.repuestos.length > 0
    ? datosReporte.repuestos.filter((r) => (r.codigo || r.descripcion || r.cantidad))
    : []
  const repuestosData = repuestos.map((r) => [
    (r.codigo || '').trim() || '',
    (r.descripcion || '').trim() || '',
    (r.cantidad || '').toString().trim() || '',
  ])
  if (repuestosData.length === 0) {
    repuestosData.push(['', '', ''])
  }

  const anchoTablaRep = PAGE_WIDTH - 2 * MARGIN
  const colCodigoRep = anchoTablaRep * 0.2
  const colDescRep = anchoTablaRep * 0.6
  const colCantRep = anchoTablaRep * 0.2

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Código del Repuesto', 'Descripción del Repuesto', 'Cantidad Utilizada']],
    body: repuestosData,
    theme: 'grid',
    styles: { lineColor: [207, 207, 207], lineWidth: 0.3 },
    headStyles: {
      fontSize: FONT_SIZE_TABLAS,
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fillColor: [248, 248, 248],
      cellPadding: CELL_PADDING,
    },
    bodyStyles: {
      fontSize: FONT_SIZE_TABLAS,
      cellPadding: CELL_PADDING,
      minCellHeight: 7,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: colCodigoRep },
      1: { cellWidth: colDescRep },
      2: { cellWidth: colCantRep },
    },
  })
  y = doc.lastAutoTable.finalY + 4
  y = ensureSpace(doc, y, headerOpts)

  // ——— 6. Observaciones Técnicas (contenido guardado o espacio para escritura manual) ———
  doc.setFontSize(FONT_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.text('6. Observaciones Técnicas', MARGIN, y)
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_TABLAS)
  const observaciones = (datosReporte.observaciones || '').trim()
  if (observaciones) {
    const lineasObs = doc.splitTextToSize(observaciones, PAGE_WIDTH - 2 * MARGIN - 4)
    doc.text(lineasObs, MARGIN, y)
    y += lineasObs.length * 4 + 4
  }
  const obsLineHeight = 4
  const obsHeight = 4 * obsLineHeight + 4
  if (y + obsHeight > BODY_MAX_Y) {
    doc.addPage()
    drawHeaderOrdenTrabajo(doc, headerOpts)
    y = BODY_START_Y
  }
  if (!observaciones) {
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.2)
    doc.rect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, obsHeight)
    for (let i = 1; i <= 4; i++) {
      doc.line(MARGIN, y + i * obsLineHeight, PAGE_WIDTH - MARGIN, y + i * obsLineHeight)
    }
  }
  y += observaciones ? 0 : obsHeight
  y += 4
  y = ensureSpace(doc, y, headerOpts)

  // ——— 7. Firmas (solo borde exterior) ———
  doc.setFontSize(FONT_SIZE)
  doc.setFont('helvetica', 'bold')
  doc.text('7. Firmas', MARGIN, y)
  y += 4

  if (y + 40 > BODY_MAX_Y) {
    doc.addPage()
    drawHeaderOrdenTrabajo(doc, headerOpts)
    y = BODY_START_Y
  }

  const ejecutanteNombre = datosReporte.ejecutanteNombre || orden.asignadoANombre || ''
  const ejecutanteFecha = datosReporte.ejecutanteFecha || ''
  const solicitanteFecha = datosReporte.solicitanteFecha || ''
  const encargadoFecha = datosReporte.encargadoFecha || ''
  const nombreSolicitante = datosReporte.solicitanteNombre || solicitanteNombre || ''
  const encargadoNombre = datosReporte.encargadoNombre || ''

  const colRol = 42
  const colNombre = 50
  const colFechaFirma = 32
  const colFirma = PAGE_WIDTH - 2 * MARGIN - colRol - colNombre - colFechaFirma
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Rol', 'Nombre', 'Fecha (opcional)', 'Firma']],
    body: [
      ['Ejecutante', ejecutanteNombre, ejecutanteFecha, ''],
      ['Cliente interno', nombreSolicitante, solicitanteFecha, ''],
      ['Encargado de mantenimiento', encargadoNombre, encargadoFecha, ''],
    ],
    theme: 'plain',
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold', fontSize: FONT_SIZE_TABLAS, cellPadding: CELL_PADDING },
    bodyStyles: { fontSize: FONT_SIZE_TABLAS, cellPadding: CELL_PADDING, minCellHeight: 10 },
    columnStyles: {
      0: { cellWidth: colRol, fontStyle: 'bold' },
      1: { cellWidth: colNombre },
      2: { cellWidth: colFechaFirma },
      3: { cellWidth: colFirma },
    },
  })
  drawTableOuterBorder(doc, y)

  // Descarga por blob + enlace para mayor compatibilidad (evita bloqueos de doc.save en algunos navegadores)
  const nombreArchivo = `orden-trabajo-${numeroOrden}.pdf`
  try {
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    doc.save(nombreArchivo)
  }
}

// ——— Reporte masivo (constantes y funciones existentes) ———
const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  proceso_cerrado: 'Proceso Cerrado',
  cancelada: 'Cancelada',
}
const NOMBRE_EMPRESA_MASIVO = 'Sweetsol'
const NOMBRE_SISTEMA_MASIVO = 'Sweetsol Mantenimiento'
const TABLE_START_Y = 42
const LOGO_WIDTH_M = 22
const LOGO_HEIGHT_M = 10
const HEADER_HEIGHT_M = 26

function dibujarEncabezadoMasivo(doc, opts) {
  const { logoBase64, fechaGeneracion, usuarioGenera } = opts
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(248, 248, 248)
  doc.rect(0, 0, 210, HEADER_HEIGHT_M, 'FD')
  doc.setDrawColor(180, 180, 180)
  doc.line(MARGIN, HEADER_HEIGHT_M, 210 - MARGIN, HEADER_HEIGHT_M)
  let xRight = MARGIN
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', MARGIN, 6, LOGO_WIDTH_M, LOGO_HEIGHT_M)
      xRight = MARGIN + LOGO_WIDTH_M + 6
    } catch (e) {}
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(40, 40, 40)
  doc.text(NOMBRE_EMPRESA_MASIVO, xRight, 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Reporte Masivo de Mantenimiento', xRight, 16)
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text(`Fecha de generación: ${fechaGeneracion}`, xRight, 22)
  if (usuarioGenera) doc.text(`Usuario: ${usuarioGenera}`, xRight, 26)
  doc.setTextColor(0, 0, 0)
}

function dibujarPieMasivo(doc, pageNumber, pageCount, fechaHoraGeneracion) {
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, FOOTER_Y - 2, 210 - MARGIN, FOOTER_Y - 2)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Página ${pageNumber} de ${pageCount}  |  ${fechaHoraGeneracion}  |  ${NOMBRE_SISTEMA_MASIVO}`,
    105,
    FOOTER_Y + 4,
    { align: 'center' }
  )
  doc.setTextColor(0, 0, 0)
}

/**
 * Genera el reporte masivo en PDF (encabezado con logo, tabla, pie).
 */
export async function exportarReporteMasivoPDF(ordenes, opciones = {}) {
  if (!ordenes || ordenes.length === 0) {
    alert('No hay órdenes para generar el reporte masivo')
    return
  }

  const fechaGen = opciones.fechaGeneracion ? new Date(opciones.fechaGeneracion) : new Date()
  const fechaGeneracion = fechaGen.toLocaleDateString('es-CO', { dateStyle: 'long' })
  const fechaHoraGeneracion = `${fechaGen.toLocaleDateString('es-CO')} ${fechaGen.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
  const usuarioGenera = opciones.usuarioGenera || '—'

  let logoBase64 = opciones.logoBase64 || null
  if (!logoBase64) logoBase64 = await cargarLogoBase64()

  const doc = new jsPDF('p', 'mm', 'a4')
  doc.setFont('helvetica')

  const filas = ordenes.map((orden, index) => {
    const numeroMatch = orden.titulo?.match(/Nro:\s*(\d+)/i)
    const codigoOrden = numeroMatch ? numeroMatch[1] : String(orden.id || index + 1)
    const fechaInicio = orden.fechaInicio ? new Date(orden.fechaInicio).toLocaleDateString('es-CO') : '—'
    const descLines = (orden.descripcion || '').split('\n')
    let area = ''
    let maquina = ''
    descLines.forEach((line) => {
      if (line.startsWith('Área:')) area = line.replace('Área:', '').trim()
      if (line.startsWith('Máquina:')) maquina = line.replace('Máquina:', '').trim()
    })
    const areaEquipo = [area, maquina || orden.equipoNombre || '—'].filter(Boolean).join(' / ') || '—'
    const tipoMantenimiento = orden.datosReporte?.tipoMantenimiento || 'Correctivo'
    const estado = ESTADO_LABEL[orden.estado] || orden.estado || '—'
    const operario = orden.asignadoANombre || '—'
    let observaciones = orden.trabajoRealizado?.split('\n')[0]?.slice(0, 50) || '—'
    if (observaciones.length >= 50) observaciones = observaciones.slice(0, 49) + '…'
    return [index + 1, fechaInicio, codigoOrden, areaEquipo, tipoMantenimiento, estado, operario, observaciones]
  })

  const encabezadoOpts = { logoBase64, fechaGeneracion, usuarioGenera }

  autoTable(doc, {
    head: [
      ['Nº', 'Fecha', 'Código / Orden', 'Área / Equipo', 'Tipo mantenimiento', 'Estado', 'Operario asignado', 'Observaciones'],
    ],
    body: filas,
    startY: TABLE_START_Y,
    margin: { top: TABLE_START_Y, left: MARGIN, right: MARGIN },
    styles: { font: 'helvetica', fontSize: 8 },
    headStyles: { fillColor: [70, 70, 70], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 35 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 28 },
      7: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      dibujarEncabezadoMasivo(doc, encabezadoOpts)
      const pageCount = doc.internal.getNumberOfPages()
      dibujarPieMasivo(doc, data.pageNumber, pageCount, fechaHoraGeneracion)
    },
  })

  const totalPages = doc.internal.getNumberOfPages()
  doc.setPage(1)
  dibujarEncabezadoMasivo(doc, encabezadoOpts)
  dibujarPieMasivo(doc, 1, totalPages, fechaHoraGeneracion)

  const fecha = fechaGen.toISOString().split('T')[0]
  doc.save(`reporte-masivo-ordenes-${fecha}.pdf`)
}

/**
 * Genera el reporte masivo en Excel.
 */
export function exportarReporteMasivoExcel(ordenes, opciones = {}) {
  if (!ordenes || ordenes.length === 0) {
    alert('No hay órdenes para generar el reporte')
    return
  }

  const fechaGen = opciones.fechaGeneracion ? new Date(opciones.fechaGeneracion) : new Date()

  const rows = ordenes.map((orden, index) => {
    const numeroMatch = orden.titulo?.match(/Nro:\s*(\d+)/i)
    const codigoOrden = numeroMatch ? numeroMatch[1] : String(orden.id || index + 1)
    const fechaInicio = orden.fechaInicio ? new Date(orden.fechaInicio).toLocaleDateString('es-CO') : '—'
    const descLines = (orden.descripcion || '').split('\n')
    let area = ''
    let maquina = ''
    descLines.forEach((line) => {
      if (line.startsWith('Área:')) area = line.replace('Área:', '').trim()
      if (line.startsWith('Máquina:')) maquina = line.replace('Máquina:', '').trim()
    })
    const areaEquipo = [area, maquina || orden.equipoNombre || '—'].filter(Boolean).join(' / ') || '—'
    const tipoMantenimiento = orden.datosReporte?.tipoOrden || orden.datosReporte?.tipoMantenimiento || 'Correctivo'
    const estado = ESTADO_LABEL[orden.estado] || orden.estado || '—'
    const operario = orden.asignadoANombre || '—'
    const observaciones = orden.trabajoRealizado?.split('\n')[0]?.slice(0, 100) || '—'

    return {
      'Nº': index + 1,
      'Fecha': fechaInicio,
      'Código / Orden': codigoOrden,
      'Área / Equipo': areaEquipo,
      'Tipo mantenimiento': tipoMantenimiento,
      'Estado': estado,
      'Operario asignado': operario,
      'Observaciones': observaciones,
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 16 },
    { wch: 35 },
    { wch: 22 },
    { wch: 18 },
    { wch: 28 },
    { wch: 50 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte Ordenes')

  const fecha = fechaGen.toISOString().split('T')[0]
  XLSX.writeFile(wb, `reporte-masivo-ordenes-${fecha}.xlsx`)
}
