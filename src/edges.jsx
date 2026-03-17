import React, { useRef } from 'react'
import { EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from 'reactflow'

// Build a right-angle path through a list of {x,y} points.
// Between each pair uses: horizontal to midX, vertical to target y, horizontal to target x.
function buildRightAnglePath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1]
    const mx = (a.x + b.x) / 2
    d += ` L ${mx} ${a.y} L ${mx} ${b.y} L ${b.x} ${b.y}`
  }
  return d
}

function WaypointHandle({ x, y, index, edgeId, waypoints }) {
  const { setEdges, getViewport } = useReactFlow()
  const drag = useRef(null)

  const onMouseDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    drag.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y }

    const onMove = (me) => {
      if (!drag.current) return
      const { zoom } = getViewport()
      const nx = drag.current.origX + (me.clientX - drag.current.startX) / zoom
      const ny = drag.current.origY + (me.clientY - drag.current.startY) / zoom
      setEdges(es => es.map(ed => ed.id !== edgeId ? ed : {
        ...ed,
        data: { ...ed.data, waypoints: waypoints.map((wp, i) => i === index ? { x: nx, y: ny } : wp) },
      }))
    }

    const onUp = () => {
      drag.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onDoubleClick = (e) => {
    e.stopPropagation()
    setEdges(es => es.map(ed => ed.id !== edgeId ? ed : {
      ...ed,
      data: { ...ed.data, waypoints: waypoints.filter((_, i) => i !== index) },
    }))
  }

  return (
    <div
      className="nodrag nopan"
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: '#4a9eff',
        border: '2px solid #1a1a1a',
        cursor: 'grab',
        pointerEvents: 'all',
      }}
    />
  )
}

export function WaypointEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, selected, markerEnd, style,
  label, labelStyle, labelBgStyle,
}) {
  const waypoints = data?.waypoints || []
  const { setEdges, screenToFlowPosition } = useReactFlow()

  let pathD
  if (waypoints.length === 0) {
    ;[pathD] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 0,
    })
  } else {
    pathD = buildRightAnglePath([
      { x: sourceX, y: sourceY },
      ...waypoints,
      { x: targetX, y: targetY },
    ])
  }

  const onPathDoubleClick = (e) => {
    e.stopPropagation()
    const { x, y } = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setEdges(es => es.map(ed => ed.id !== id ? ed : {
      ...ed,
      data: { ...ed.data, waypoints: [...waypoints, { x, y }] },
    }))
  }

  const labelX = (sourceX + targetX) / 2
  const labelY = (sourceY + targetY) / 2

  return (
    <>
      {/* Wide invisible hit area for double-click to add anchor */}
      <path
        d={pathD}
        strokeWidth={14}
        stroke="transparent"
        fill="none"
        onDoubleClick={onPathDoubleClick}
      />
      {/* Visible path */}
      <path
        d={pathD}
        style={style}
        fill="none"
        markerEnd={markerEnd}
        className="react-flow__edge-path"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: labelBgStyle?.fill ?? '#1a1a1a',
              color: labelStyle?.fill ?? '#bbb',
              fontSize: labelStyle?.fontSize ?? 11,
              padding: '2px 6px',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      {selected && waypoints.length > 0 && (
        <EdgeLabelRenderer>
          {waypoints.map((wp, i) => (
            <WaypointHandle
              key={i}
              x={wp.x}
              y={wp.y}
              index={i}
              edgeId={id}
              waypoints={waypoints}
            />
          ))}
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const edgeTypes = { waypoint: WaypointEdge }
