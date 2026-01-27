import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

/**
 * Genera y descarga el informe técnico en PDF.
 * @param {Object} orden - { id, titulo, descripcion, trabajoRealizado, evidencias }
 * @param {string|null} firmaDataURL - Base64 de la firma (image/png)
 * @param {string} [generadoPor]
 */
export function exportarInformePDF(orden, firmaDataURL, generadoPor = '') {
  const doc = new jsPDF()
  let y = 20

  doc.setFontSize(16)
  doc.text('Informe técnico de mantenimiento', 14, y)
  y += 12

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`Orden: #${orden.id}`, 14, y)
  y += 7
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}`, 14, y)
  y += 7

  if (orden.titulo || orden.descripcion) {
    doc.setFont(undefined, 'bold')
    doc.text('Descripción', 14, y)
    y += 6
    doc.setFont(undefined, 'normal')
    const desc = (orden.titulo || '') + (orden.descripcion ? '\n' + orden.descripcion : '')
    const lines = doc.splitTextToSize(desc, 180)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 4
  }

  if (orden.trabajoRealizado) {
    doc.setFont(undefined, 'bold')
    doc.text('Trabajo realizado', 14, y)
    y += 6
    doc.setFont(undefined, 'normal')
    const lines = doc.splitTextToSize(orden.trabajoRealizado, 180)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 4
  }

  const evidencias = Array.isArray(orden.evidencias) ? orden.evidencias : []
  if (evidencias.length > 0) {
    doc.setFont(undefined, 'bold')
    doc.text('Evidencias', 14, y)
    y += 6
    doc.setFont(undefined, 'normal')
    evidencias.forEach((e, i) => {
      const nombre = (typeof e === 'object' && e?.nombre) ? e.nombre : (e?.url || e || `Evidencia ${i + 1}`)
      doc.text(`• ${nombre}`, 14, y)
      y += 5
    })
    y += 4
  }

  if (firmaDataURL) {
    doc.setFont(undefined, 'bold')
    doc.text('Firma', 14, y)
    y += 6
    try {
      doc.addImage(firmaDataURL, 'PNG', 14, y, 50, 22)
      y += 28
    } catch {
      doc.text('[Firma incluida]', 14, y)
      y += 8
    }
  } else {
    doc.text('Firma: —', 14, y)
    y += 8
  }

  if (generadoPor) {
    doc.setFontSize(8)
    doc.text(`Generado por: ${generadoPor}`, 14, doc.internal.pageSize.height - 10)
  }

  doc.save(`informe-tecnico-orden-${orden.id}.pdf`)
}

/**
 * Genera y descarga el informe técnico en Excel.
 * @param {Object} orden
 * @param {string|null} firmaDataURL - No se embebe; se indica "Sí" si existe.
 * @param {string} [generadoPor]
 */
export function exportarInformeExcel(orden, firmaDataURL, generadoPor = '') {
  const evidencias = Array.isArray(orden.evidencias) ? orden.evidencias : []
  const evidenciasStr = evidencias
    .map((e, i) => (typeof e === 'object' && e?.nombre) ? e.nombre : (e?.url || e || `Evidencia ${i + 1}`))
    .join('; ')

  const rows = [
    ['Informe técnico de mantenimiento'],
    [],
    ['Orden', `#${orden.id}`],
    ['Fecha', new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })],
    ['Descripción', orden.titulo || orden.descripcion || '—'],
    ['Trabajo realizado', orden.trabajoRealizado || '—'],
    ['Evidencias', evidenciasStr || '—'],
    ['Firma', firmaDataURL ? 'Sí' : 'No'],
    ...(generadoPor ? [['Generado por', generadoPor]] : []),
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 22 }, { wch: 80 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Informe')

  XLSX.writeFile(wb, `informe-tecnico-orden-${orden.id}.xlsx`)
}
