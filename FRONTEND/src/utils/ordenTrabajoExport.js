import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

/**
 * Genera y descarga el reporte completo de Orden de Trabajo en PDF.
 * Formato similar al documento físico de orden de mantenimiento.
 * @param {Object} orden - Orden completa con todos los datos
 * @param {Object} datosReporte - Datos adicionales del reporte (opcional si orden.datosReporte existe)
 * @param {string|null} firmaEjecutante - Base64 de la firma del ejecutante (opcional si orden.datosReporte.firmas existe)
 * @param {string|null} firmaSolicitante - Base64 de la firma del solicitante (opcional si orden.datosReporte.firmas existe)
 * @param {string|null} firmaEncargado - Base64 de la firma del encargado (opcional si orden.datosReporte.firmas existe)
 */
export function exportarOrdenTrabajoPDF(orden, datosReporte, firmaEjecutante, firmaSolicitante, firmaEncargado) {
  // Si la orden ya tiene datosReporte guardado, usarlo en lugar de los parámetros
  if (orden.datosReporte) {
    datosReporte = orden.datosReporte
    if (datosReporte.firmas) {
      firmaEjecutante = datosReporte.firmas.ejecutante || firmaEjecutante
      firmaSolicitante = datosReporte.firmas.solicitante || firmaSolicitante
      firmaEncargado = datosReporte.firmas.encargado || firmaEncargado
    }
  }
  
  // Si no hay datosReporte, crear uno vacío para evitar errores
  if (!datosReporte) {
    datosReporte = {}
  }
  const doc = new jsPDF('p', 'mm', 'a4')
  let y = 15

  // Extraer número de orden del título
  const numeroMatch = orden.titulo?.match(/Nro:\s*(\d+)/i)
  const numeroOrden = numeroMatch ? numeroMatch[1] : orden.id

  // ENCABEZADO
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('ORDEN DE TRABAJO', 105, y, { align: 'center' })
  y += 6
  doc.setFontSize(12)
  doc.text(`Nro: ${numeroOrden}`, 105, y, { align: 'center' })
  y += 5
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`Tipo de Orden: ${datosReporte.tipoOrden || 'Orden de mantenimiento'}`, 105, y, { align: 'center' })
  y += 8

  // SECCIÓN 1: FECHAS
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('1. FECHAS', 14, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')

  const prioridadLabel = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
  }
  doc.text(`Prioridad: ${prioridadLabel[orden.prioridad] || orden.prioridad}`, 14, y)
  doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-CO')}`, 105, y)
  y += 5
  doc.text(`Fecha Inicio: ${orden.fechaInicio ? new Date(orden.fechaInicio).toLocaleDateString('es-CO') : '—'}`, 14, y)
  doc.text(`Fecha Fin: ${orden.fechaCierre ? new Date(orden.fechaCierre).toLocaleDateString('es-CO') : '—'}`, 105, y)
  y += 8

  // SECCIÓN 2: DATOS DEL OBJETO
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('2. DATOS DEL OBJETO', 14, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')

  // Extraer área y máquina de la descripción
  const descLines = orden.descripcion?.split('\n') || []
  let area = ''
  let maquina = ''
  let ubicacionTecnica = datosReporte.ubicacionTecnica || '—'
  let emplazamiento = datosReporte.emplazamiento || '—'

  descLines.forEach((line) => {
    if (line.startsWith('Área:')) area = line.replace('Área:', '').trim()
    if (line.startsWith('Máquina:')) maquina = line.replace('Máquina:', '').trim()
  })

  doc.text(`Cod Equipo: ${orden.equipoId || '—'}`, 14, y)
  doc.text(`Descrip Equip: ${maquina || orden.equipoNombre || '—'}`, 80, y)
  y += 5
  doc.text(`Emplazamiento: ${emplazamiento}`, 14, y)
  doc.text(`Área: ${area || '—'}`, 80, y)
  y += 5
  doc.text(`Ubicación técnica: ${ubicacionTecnica}`, 14, y)
  doc.text(`Grupo planificador: ${datosReporte.grupoPlanificador || 'Producción'}`, 80, y)
  y += 5
  doc.text(`Resp. Pto Triba: ${datosReporte.responsablePtoTriba || 'Mantenimiento'}`, 14, y)
  doc.text(`Responsable 1: ${orden.asignadoANombre || datosReporte.responsable1 || '—'}`, 80, y)
  y += 8

  // DATOS DE CABECERA
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text(orden.titulo || 'Orden de mantenimiento', 14, y)
  y += 8

  // SECCIÓN 4: OPERACIONES PLANEADAS
  if (datosReporte.operacionesPlaneadas && datosReporte.operacionesPlaneadas.length > 0) {
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('4. OPERACIONES PLANEADAS', 14, y)
    y += 6

    const opsData = datosReporte.operacionesPlaneadas.map((op, idx) => [
      idx + 1,
      op.puestoTrabajo || '—',
      op.descripcion || '—',
      op.cantPersonas || '—',
      op.horasTrabajo || '—',
      op.horaInicio || '—',
      op.horaFin || '—',
      op.horasReales || '—',
      op.ejecuto ? '✓' : '',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Puesto Trabajo', 'Descripción', 'Cant. Personas', 'Horas Trabajo', 'Hora Inicio', 'Hora Fin', 'Horas Reales', 'Ejecutó']],
      body: opsData,
      headStyles: { fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 15 },
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 5
  } else {
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('4. OPERACIONES PLANEADAS', 14, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('No hay operaciones planeadas registradas.', 14, y)
    y += 8
  }

  // SECCIÓN 5: OPERACIONES EJECUTADAS NO PLANEADAS
  if (datosReporte.operacionesNoPlaneadas && datosReporte.operacionesNoPlaneadas.length > 0) {
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('5. OP EJECUTADAS NO PLANEADAS', 14, y)
    y += 6

    const opsNoPlaneadasData = datosReporte.operacionesNoPlaneadas.map((op, idx) => [
      idx + 1,
      op.descripcion || '—',
      op.horaInicio || '—',
      op.horaFin || '—',
      op.horasReales || '—',
      op.ejecuto ? '✓' : '',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Descripción', 'Hora I', 'Hora F', 'Horas R', 'Ejecutó']],
      body: opsNoPlaneadasData,
      headStyles: { fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 5
  } else {
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('5. OP EJECUTADAS NO PLANEADAS', 14, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('No hay operaciones no planeadas registradas.', 14, y)
    y += 8
  }

  // SECCIÓN 6: REPUESTOS
  if (datosReporte.repuestos && datosReporte.repuestos.length > 0) {
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('6. REPUESTOS', 14, y)
    y += 6

    const repuestosData = datosReporte.repuestos.map((rep, idx) => [
      idx + 1,
      rep.codigo || '—',
      rep.descripcion || '—',
      rep.cantidad || '—',
      rep.tipoPosicion || '—',
      rep.documento || '—',
    ])

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Código', 'Descripción', 'Cant.', 'Tipo Posición', 'Documento']],
      body: repuestosData,
      headStyles: { fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 5
  } else {
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('6. REPUESTOS', 14, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text('No hay repuestos registrados.', 14, y)
    y += 8
  }

  // SECCIÓN 7: OBSERVACIONES
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('7. OBSERVACIONES', 14, y)
  y += 6
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  const observaciones = datosReporte.observaciones || orden.trabajoRealizado || orden.descripcion || '—'
  const obsLines = doc.splitTextToSize(observaciones, 180)
  doc.text(obsLines, 14, y)
  y += obsLines.length * 4 + 8

  // SECCIÓN 8: FIRMAS - Diseño en tres columnas horizontales
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('8. FIRMAS', 14, y)
  y += 6 // Reducido de 8 a 6 para acercar las firmas

  // Verificar si necesitamos nueva página (solo si realmente no cabe)
  if (y > 220) {
    doc.addPage()
    y = 15
  }

  const anchoColumna = 58 // Ancho de cada columna de firma
  const espacioEntreColumnas = 2 // Espacio entre columnas
  const inicioCol1 = 14
  const inicioCol2 = inicioCol1 + anchoColumna + espacioEntreColumnas
  const inicioCol3 = inicioCol2 + anchoColumna + espacioEntreColumnas
  const alturaFirma = 18 // Reducido de 25 a 18 para hacer las firmas más pequeñas
  const alturaTotal = 35 // Reducido de 45 a 35 para optimizar espacio

  // Extraer solicitante de la descripción
  let solicitanteNombre = '—'
  descLines.forEach((line) => {
    if (line.startsWith('Solicitante:')) {
      solicitanteNombre = line.replace('Solicitante:', '').trim()
    }
  })

  const yInicial = y

  // COLUMNA 1: Ejecutante
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('Ejecutante', inicioCol1, y)
  y += 4 // Reducido de 5 a 4
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.text(`Nombre: ${datosReporte.ejecutanteNombre || orden.asignadoANombre || '—'}`, inicioCol1, y)
  y += 3.5 // Reducido de 4 a 3.5
  doc.text(`Fecha: ${datosReporte.ejecutanteFecha || new Date().toLocaleDateString('es-CO')}`, inicioCol1, y)
  y += 4 // Reducido de 5 a 4
  
  // Dibujar rectángulo para la firma
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(inicioCol1, y, anchoColumna - 2, alturaFirma)
  
  // Agregar la imagen de la firma si existe
  if (firmaEjecutante) {
    try {
      doc.addImage(firmaEjecutante, 'PNG', inicioCol1 + 1, y + 1, anchoColumna - 4, alturaFirma - 2)
    } catch (e) {
      // Si falla, dibujar una línea como placeholder
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(inicioCol1 + 5, y + alturaFirma / 2, inicioCol1 + anchoColumna - 7, y + alturaFirma / 2)
    }
  } else {
    // Dibujar línea para firma manual
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(inicioCol1 + 5, y + alturaFirma / 2, inicioCol1 + anchoColumna - 7, y + alturaFirma / 2)
  }

  // COLUMNA 2: Cliente interno (Solicitante)
  y = yInicial
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('Cliente interno (solicitante)', inicioCol2, y)
  y += 4 // Reducido de 5 a 4
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.text(`Nombre: ${datosReporte.solicitanteNombre || solicitanteNombre}`, inicioCol2, y)
  y += 3.5 // Reducido de 4 a 3.5
  doc.text(`Fecha: ${datosReporte.solicitanteFecha || new Date().toLocaleDateString('es-CO')}`, inicioCol2, y)
  y += 4 // Reducido de 5 a 4
  
  // Dibujar rectángulo para la firma
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(inicioCol2, y, anchoColumna - 2, alturaFirma)
  
  // Agregar la imagen de la firma si existe
  if (firmaSolicitante) {
    try {
      doc.addImage(firmaSolicitante, 'PNG', inicioCol2 + 1, y + 1, anchoColumna - 4, alturaFirma - 2)
    } catch (e) {
      // Si falla, dibujar una línea como placeholder
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(inicioCol2 + 5, y + alturaFirma / 2, inicioCol2 + anchoColumna - 7, y + alturaFirma / 2)
    }
  } else {
    // Dibujar línea para firma manual
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(inicioCol2 + 5, y + alturaFirma / 2, inicioCol2 + anchoColumna - 7, y + alturaFirma / 2)
  }

  // COLUMNA 3: Firma Encargado Mantenimiento
  y = yInicial
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text('Firma Encargado Mantenimiento', inicioCol3, y)
  y += 4 // Reducido de 5 a 4
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.text(`Fecha: ${datosReporte.encargadoFecha || new Date().toLocaleDateString('es-CO')}`, inicioCol3, y)
  y += 7.5 // Reducido de 9 a 7.5 (menos espacio porque no hay nombre)
  
  // Dibujar rectángulo para la firma
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(inicioCol3, y, anchoColumna - 2, alturaFirma)
  
  // Agregar la imagen de la firma si existe
  if (firmaEncargado) {
    try {
      doc.addImage(firmaEncargado, 'PNG', inicioCol3 + 1, y + 1, anchoColumna - 4, alturaFirma - 2)
    } catch (e) {
      // Si falla, dibujar una línea como placeholder
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(inicioCol3 + 5, y + alturaFirma / 2, inicioCol3 + anchoColumna - 7, y + alturaFirma / 2)
    }
  } else {
    // Dibujar línea para firma manual
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(inicioCol3 + 5, y + alturaFirma / 2, inicioCol3 + anchoColumna - 7, y + alturaFirma / 2)
  }

  y = yInicial + alturaTotal

  // Guardar PDF
  doc.save(`orden-trabajo-${numeroOrden}.pdf`)
}

/**
 * Genera un reporte masivo con múltiples órdenes de trabajo en un solo PDF.
 * Cada orden se genera en una página separada.
 * @param {Array<Object>} ordenes - Array de órdenes completas
 * @param {Object} datosReporteGlobal - Datos globales del reporte (aplicados a todas las órdenes)
 * @param {Object} firmasGlobales - Firmas globales (aplicadas a todas las órdenes)
 */
export function exportarReporteMasivoPDF(ordenes, datosReporteGlobal = {}, firmasGlobales = {}) {
  if (!ordenes || ordenes.length === 0) {
    alert('No hay órdenes para generar el reporte masivo')
    return
  }

  const doc = new jsPDF('p', 'mm', 'a4')
  let y = 20

  // PORTADA - Mejor formato
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('REPORTE MASIVO DE ÓRDENES DE TRABAJO', 105, y, { align: 'center' })
  y += 12
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(30, y, 180, y)
  y += 10
  
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(`Total de órdenes: ${ordenes.length}`, 105, y, { align: 'center' })
  y += 7
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}`, 105, y, { align: 'center' })
  y += 7
  doc.text(`Hora de generación: ${new Date().toLocaleTimeString('es-CO')}`, 105, y, { align: 'center' })
  y += 15

  // ÍNDICE
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('ÍNDICE DE ÓRDENES', 14, y)
  y += 8
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')

  ordenes.forEach((orden, index) => {
    const numeroMatch = orden.titulo?.match(/Nro:\s*(\d+)/i)
    const numeroOrden = numeroMatch ? numeroMatch[1] : orden.id
    // Limpiar título para el índice
    let titulo = orden.titulo || orden.descripcion || `Orden #${orden.id}`
    // Remover prefijos repetidos
    titulo = titulo.replace(/^ORDEN DE TRABAJO Nro:\s*\d+\s*-?\s*/i, '').trim()
    if (!titulo) titulo = `Orden #${orden.id}`
    
    doc.text(`${index + 1}. Orden Nro: ${numeroOrden}`, 20, y)
    y += 4
    const tituloLines = doc.splitTextToSize(titulo, 160)
    doc.text(tituloLines, 25, y)
    y += tituloLines.length * 4 + 3
    
    if (y > 270) {
      doc.addPage()
      y = 15
    }
  })

  // Generar cada orden en una página separada
  ordenes.forEach((orden, index) => {
    if (index > 0) {
      doc.addPage()
    }
    y = 20

    // Extraer número de orden del título
    const numeroMatch = orden.titulo?.match(/Nro:\s*(\d+)/i)
    const numeroOrden = numeroMatch ? numeroMatch[1] : orden.id

    // ENCABEZADO - Mejor formato
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('ORDEN DE TRABAJO', 105, y, { align: 'center' })
    y += 7
    doc.setFontSize(11)
    doc.text(`Nro: ${numeroOrden}`, 105, y, { align: 'center' })
    y += 6
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text(`Tipo de Orden: ${datosReporteGlobal.tipoOrden || 'Orden de mantenimiento'}`, 105, y, { align: 'center' })
    y += 10
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(14, y, 196, y)
    y += 8

    // SECCIÓN 1: FECHAS
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('1. FECHAS', 14, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')

    const prioridadLabel = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
    }
    doc.text(`Prioridad: ${prioridadLabel[orden.prioridad] || orden.prioridad}`, 14, y)
    doc.text(`Fecha Impresión: ${new Date().toLocaleDateString('es-CO')}`, 110, y)
    y += 5
    doc.text(`Fecha Inicio: ${orden.fechaInicio ? new Date(orden.fechaInicio).toLocaleDateString('es-CO') : '—'}`, 14, y)
    doc.text(`Fecha Fin: ${orden.fechaCierre ? new Date(orden.fechaCierre).toLocaleDateString('es-CO') : '—'}`, 110, y)
    y += 10

    // SECCIÓN 2: DATOS DEL OBJETO
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('2. DATOS DEL OBJETO', 14, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')

    // Extraer área y máquina de la descripción
    const descLines = orden.descripcion?.split('\n') || []
    let area = ''
    let maquina = ''
    let ubicacionTecnica = datosReporteGlobal.ubicacionTecnica || '—'
    let emplazamiento = datosReporteGlobal.emplazamiento || '—'

    descLines.forEach((line) => {
      if (line.startsWith('Área:')) area = line.replace('Área:', '').trim()
      if (line.startsWith('Máquina:')) maquina = line.replace('Máquina:', '').trim()
    })

    doc.text(`Cod Equipo: ${orden.equipoId || '—'}`, 14, y)
    doc.text(`Descrip Equip: ${maquina || orden.equipoNombre || '—'}`, 105, y)
    y += 5
    doc.text(`Emplazamiento: ${emplazamiento}`, 14, y)
    doc.text(`Área: ${area || '—'}`, 105, y)
    y += 5
    doc.text(`Ubicación técnica: ${ubicacionTecnica}`, 14, y)
    doc.text(`Grupo planificador: ${datosReporteGlobal.grupoPlanificador || 'Producción'}`, 105, y)
    y += 5
    doc.text(`Resp. Pto Triba: ${datosReporteGlobal.responsablePtoTriba || 'Mantenimiento'}`, 14, y)
    doc.text(`Responsable 1: ${orden.asignadoANombre || datosReporteGlobal.responsable1 || '—'}`, 105, y)
    y += 10

    // SECCIÓN 3: DESCRIPCIÓN
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('3. DESCRIPCIÓN', 14, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    
    // Limpiar descripción para evitar duplicación
    let descripcion = orden.descripcion || orden.titulo || '—'
    // Remover información que ya se mostró en datos del objeto
    descripcion = descripcion
      .replace(/Área:\s*[^\n]+\n?/gi, '')
      .replace(/Máquina:\s*[^\n]+\n?/gi, '')
      .replace(/Solicitante:\s*[^\n]+\n?/gi, '')
      .trim()
    
    if (descripcion && descripcion !== '—') {
      const descLines2 = doc.splitTextToSize(descripcion, 180)
      doc.text(descLines2, 14, y)
      y += descLines2.length * 4 + 5
    } else {
      doc.text('—', 14, y)
      y += 5
    }
    y += 3

    // SECCIÓN 4: TRABAJO REALIZADO
    if (orden.trabajoRealizado) {
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('4. TRABAJO REALIZADO', 14, y)
      y += 6
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      const trabajoLines = doc.splitTextToSize(orden.trabajoRealizado, 180)
      doc.text(trabajoLines, 14, y)
      y += trabajoLines.length * 4 + 5
    }

    // SECCIÓN 5: EVIDENCIAS
    const evidencias = Array.isArray(orden.evidencias) ? orden.evidencias : []
    if (evidencias.length > 0) {
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('5. EVIDENCIAS', 14, y)
      y += 6
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      evidencias.forEach((ev, idx) => {
        const nombre = (typeof ev === 'object' && ev?.nombre) ? ev.nombre : (ev?.url || ev || `Evidencia ${idx + 1}`)
        doc.text(`${idx + 1}. ${nombre}`, 14, y)
        y += 5
        if (y > 270) {
          doc.addPage()
          y = 15
        }
      })
      y += 3
    }

    // SECCIÓN 6: OBSERVACIONES (solo si hay observaciones específicas, no duplicar trabajo realizado)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('6. OBSERVACIONES', 14, y)
    y += 6
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    
    // Solo usar observaciones globales, no duplicar trabajo realizado
    const observaciones = datosReporteGlobal.observaciones || '—'
    if (observaciones && observaciones !== '—' && observaciones !== orden.trabajoRealizado) {
      const obsLines = doc.splitTextToSize(observaciones, 180)
      doc.text(obsLines, 14, y)
      y += obsLines.length * 4 + 5
    } else {
      doc.text('—', 14, y)
      y += 5
    }
    y += 5

    // SECCIÓN 7: FIRMAS (simplificadas para reporte masivo)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('7. FIRMAS', 14, y)
    y += 8

    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    doc.text('Ejecutante:', 14, y)
    y += 5
    doc.setFont(undefined, 'normal')
    doc.text(`Nombre: ${orden.asignadoANombre || datosReporteGlobal.ejecutanteNombre || '—'}`, 14, y)
    y += 5
    doc.text(`Fecha: ${datosReporteGlobal.ejecutanteFecha || new Date().toLocaleDateString('es-CO')}`, 14, y)
    y += 8

    doc.setFont(undefined, 'bold')
    doc.text('Cliente interno (solicitante):', 14, y)
    y += 5
    doc.setFont(undefined, 'normal')
    let solicitanteNombre = '—'
    descLines.forEach((line) => {
      if (line.startsWith('Solicitante:')) {
        solicitanteNombre = line.replace('Solicitante:', '').trim()
      }
    })
    doc.text(`Nombre: ${datosReporteGlobal.solicitanteNombre || solicitanteNombre}`, 14, y)
    y += 5
    doc.text(`Fecha: ${datosReporteGlobal.solicitanteFecha || new Date().toLocaleDateString('es-CO')}`, 14, y)
    y += 8

    doc.setFont(undefined, 'bold')
    doc.text('Firma Encargado Mantenimiento:', 14, y)
    y += 5
    doc.setFont(undefined, 'normal')
    doc.text(`Fecha: ${datosReporteGlobal.encargadoFecha || new Date().toLocaleDateString('es-CO')}`, 14, y)
  })

  // Guardar PDF
  const fecha = new Date().toISOString().split('T')[0]
  doc.save(`reporte-masivo-ordenes-${fecha}.pdf`)
}
