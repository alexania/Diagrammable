/**
 * Export the current diagram to a semantically-annotated SVG.
 *
 * The SVG includes:
 *  - A <desc> block with a plain-text summary of nodes and edges (AI-readable)
 *  - data-node-id, data-node-type, data-label attributes on node groups
 *  - data-source, data-target, data-label on edge groups
 *  - Exact positions preserved
 */
export function exportToSvg(nodes, edges, viewport) {
  if (!nodes.length) return null

  // Compute bounding box with padding
  const PAD = 40
  const xs = nodes.map(n => n.position.x)
  const ys = nodes.map(n => n.position.y)
  const ws = nodes.map(n => n.width || 120)
  const hs = nodes.map(n => n.height || 40)
  const minX = Math.min(...xs) - PAD
  const minY = Math.min(...ys) - PAD
  const maxX = Math.max(...xs.map((x, i) => x + ws[i])) + PAD
  const maxY = Math.max(...ys.map((y, i) => y + hs[i])) + PAD
  const W = maxX - minX
  const H = maxY - minY

  // Build summary text for <desc>
  const nodeList = nodes.map(n => `${n.data.label} (${n.type})`).join(', ')
  const edgeList = edges.map(e => {
    const src = nodes.find(n => n.id === e.source)?.data.label || e.source
    const tgt = nodes.find(n => n.id === e.target)?.data.label || e.target
    const lbl = e.label ? ` [${e.label}]` : ''
    return `${src} -> ${tgt}${lbl}`
  }).join(', ')
  const summary = `nodes: ${nodeList || 'none'}\nedges: ${edgeList || 'none'}`

  // SVG node shape renderers
  const renderNode = (node) => {
    const x = node.position.x - minX
    const y = node.position.y - minY
    const w = node.width || 120
    const h = node.height || 40
    const bg = node.data.bg
    const border = node.data.border
    const label = node.data.label
    const cx = x + w / 2
    const cy = y + h / 2
    const fontSize = 13
    const color = node.data.color || '#e8e8e8'

    let shape = ''
    if (node.type === 'rect') {
      shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="${bg || '#1e2a3a'}" stroke="${border || '#3a5a7a'}" stroke-width="2"/>`
    } else if (node.type === 'rounded') {
      shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" ry="${h / 2}" fill="${bg || '#1a3a2a'}" stroke="${border || '#3a7a5a'}" stroke-width="2"/>`
    } else if (node.type === 'diamond') {
      const pts = `${cx},${y + 4} ${x + w - 4},${cy} ${cx},${y + h - 4} ${x + 4},${cy}`
      shape = `<polygon points="${pts}" fill="${bg || '#2a2a1a'}" stroke="${border || '#7a7a3a'}" stroke-width="2"/>`
    } else if (node.type === 'cylinder') {
      const rx2 = w / 2
      const ry2 = 12
      shape = `
        <rect x="${x + 2}" y="${y + ry2}" width="${w - 4}" height="${h - ry2 * 2}" fill="${bg || '#2a1a3a'}" stroke="${border || '#5a3a7a'}" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${y + ry2}" rx="${rx2 - 2}" ry="${ry2}" fill="${bg || '#2a1a3a'}" stroke="${border || '#5a3a7a'}" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${y + h - ry2}" rx="${rx2 - 2}" ry="${ry2}" fill="${bg || '#2a1a3a'}" stroke="${border || '#5a3a7a'}" stroke-width="2"/>`
    } else if (node.type === 'text') {
      // no background shape
    }

    // Text wrapping (simple: split at spaces, ~18 chars per line)
    const words = label.split(' ')
    const lines = []
    let line = ''
    const MAX = Math.max(10, Math.floor(w / 7.5))
    for (const word of words) {
      if ((line + ' ' + word).trim().length > MAX && line) {
        lines.push(line)
        line = word
      } else {
        line = (line + ' ' + word).trim()
      }
    }
    if (line) lines.push(line)

    const lineH = fontSize * 1.4
    const totalTextH = lines.length * lineH
    const textStartY = cy - totalTextH / 2 + fontSize * 0.8

    const textLines = lines.map((l, i) =>
      `<tspan x="${cx}" dy="${i === 0 ? 0 : lineH}">${escXml(l)}</tspan>`
    ).join('')

    return `
  <g data-node-id="${escAttr(node.id)}" data-node-type="${node.type}" data-label="${escAttr(label)}">
    ${shape}
    <text x="${cx}" y="${textStartY}" text-anchor="middle" font-size="${fontSize}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" fill="${color}" pointer-events="none">${textLines}</text>
  </g>`
  }

  // Edge renderer (straight line with arrowhead)
  const renderEdge = (edge) => {
    const src = nodes.find(n => n.id === edge.source)
    const tgt = nodes.find(n => n.id === edge.target)
    if (!src || !tgt) return ''

    const sx = src.position.x - minX + (src.width || 120) / 2
    const sy = src.position.y - minY + (src.height || 40) / 2
    const tx = tgt.position.x - minX + (tgt.width || 120) / 2
    const ty = tgt.position.y - minY + (tgt.height || 40) / 2

    // Shorten line to edge of target node
    const dx = tx - sx
    const dy = ty - sy
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const tw = (tgt.width || 120) / 2 + 6
    const th = (tgt.height || 40) / 2 + 6
    const scale = Math.min(tw / Math.abs(dx || 0.01), th / Math.abs(dy || 0.01))
    const ex = tx - dx / len * Math.min(scale * len, len - 1) * (Math.abs(dx) / len)
    const ey = ty - dy / len * Math.min(scale * len, len - 1) * (Math.abs(dy) / len)

    const label = edge.label || ''
    const mx = (sx + tx) / 2
    const my = (sy + ty) / 2

    return `
  <g data-edge-id="${escAttr(edge.id)}" data-source="${escAttr(edge.source)}" data-target="${escAttr(edge.target)}" data-label="${escAttr(label)}">
    <line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${edge.style?.stroke || '#888'}" stroke-width="${edge.style?.strokeWidth || 1.5}" marker-end="url(#arrow)"/>
    ${label ? `<rect x="${mx - label.length * 3.5 - 4}" y="${my - 9}" width="${label.length * 7 + 8}" height="16" rx="3" fill="#1a1a1a" opacity="0.85"/>
    <text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" fill="#bbb">${escXml(label)}</text>` : ''}
  </g>`
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <desc>
${summary}
  </desc>
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L8,3 z" fill="#888"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="#0f0f0f"/>
  ${edges.map(renderEdge).join('')}
  ${nodes.map(renderNode).join('')}
</svg>`

  return svgContent
}

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
