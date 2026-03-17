import React, { useState, useRef, useEffect } from 'react'
import { Handle, Position, NodeResizer } from 'reactflow'

const baseStyle = {
  padding: '10px 16px',
  fontSize: '13px',
  fontFamily: 'inherit',
  cursor: 'default',
  minWidth: 80,
  minHeight: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  lineHeight: 1.4,
  userSelect: 'none',
  position: 'relative',
}

function EditableLabel({ label, onChange }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(label)
  const ref = useRef(null)

  useEffect(() => { setValue(label) }, [label])

  const commit = () => {
    setEditing(false)
    if (value.trim() !== label) onChange(value.trim() || label)
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={value}
        autoFocus
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit() } if (e.key === 'Escape') { setValue(label); setEditing(false) } }}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'inherit',
          font: 'inherit',
          textAlign: 'center',
          resize: 'none',
          width: '100%',
          overflow: 'hidden',
          lineHeight: 1.4,
        }}
        rows={2}
      />
    )
  }

  return (
    <span onDoubleClick={() => setEditing(true)} style={{ width: '100%' }}>
      {label}
    </span>
  )
}

const handles = (
  <>
    <Handle type="source" position={Position.Top} id="t" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Right} id="r" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Bottom} id="b" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Left} id="l" style={{ background: '#555' }} />
    <Handle type="target" position={Position.Top} id="t" style={{ background: '#555' }} />
    <Handle type="target" position={Position.Right} id="r" style={{ background: '#555' }} />
    <Handle type="target" position={Position.Bottom} id="b" style={{ background: '#555' }} />
    <Handle type="target" position={Position.Left} id="l" style={{ background: '#555' }} />
  </>
)

export function RectNode({ data, selected }) {
  return (
    <div style={{
      ...baseStyle,
      background: data.bg || '#1e2a3a',
      border: `2px solid ${selected ? '#4a9eff' : (data.border || '#3a5a7a')}`,
      borderRadius: 6,
      color: data.color || '#e8e8e8',
      width: '100%',
      height: '100%',
    }}>
      <NodeResizer minWidth={80} minHeight={36} isVisible={selected} color="#4a9eff" />
      {handles}
      <EditableLabel label={data.label} onChange={data.onLabelChange} />
    </div>
  )
}

export function RoundedNode({ data, selected }) {
  return (
    <div style={{
      ...baseStyle,
      background: data.bg || '#1a3a2a',
      border: `2px solid ${selected ? '#4a9eff' : (data.border || '#3a7a5a')}`,
      borderRadius: 24,
      color: data.color || '#e8e8e8',
      width: '100%',
      height: '100%',
    }}>
      <NodeResizer minWidth={80} minHeight={36} isVisible={selected} color="#4a9eff" />
      {handles}
      <EditableLabel label={data.label} onChange={data.onLabelChange} />
    </div>
  )
}

export function DiamondNode({ data, selected }) {
  return (
    <div style={{
      ...baseStyle,
      background: 'transparent',
      border: 'none',
      width: '100%',
      height: '100%',
    }}>
      <NodeResizer minWidth={80} minHeight={80} isVisible={selected} color="#4a9eff" />
      {handles}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <polygon
          points="50%,4 97%,50% 50%,96% 3%,50%"
          fill={data.bg || '#2a2a1a'}
          stroke={selected ? '#4a9eff' : (data.border || '#7a7a3a')}
          strokeWidth={2}
          style={{ width: '100%', height: '100%' }}
        />
      </svg>
      <EditableLabel label={data.label} onChange={data.onLabelChange} />
    </div>
  )
}

export function CylinderNode({ data, selected }) {
  return (
    <div style={{
      ...baseStyle,
      background: 'transparent',
      border: 'none',
      width: '100%',
      height: '100%',
    }}>
      <NodeResizer minWidth={80} minHeight={60} isVisible={selected} color="#4a9eff" />
      {handles}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <rect
          x="2" y="14"
          width="calc(100% - 4px)"
          height="calc(100% - 28px)"
          fill={data.bg || '#2a1a3a'}
          stroke={selected ? '#4a9eff' : (data.border || '#5a3a7a')}
          strokeWidth={2}
          style={{ width: 'calc(100% - 4px)', height: 'calc(100% - 28px)' }}
        />
        <ellipse
          cx="50%" cy="14"
          rx="calc(50% - 2px)"
          ry="12"
          fill={data.bg || '#2a1a3a'}
          stroke={selected ? '#4a9eff' : (data.border || '#5a3a7a')}
          strokeWidth={2}
        />
        <ellipse
          cx="50%" cy="calc(100% - 14px)"
          rx="calc(50% - 2px)"
          ry="12"
          fill={data.bg || '#2a1a3a'}
          stroke={selected ? '#4a9eff' : (data.border || '#5a3a7a')}
          strokeWidth={2}
          strokeDasharray="none"
        />
      </svg>
      <EditableLabel label={data.label} onChange={data.onLabelChange} />
    </div>
  )
}

export function TextNode({ data, selected }) {
  return (
    <div style={{
      ...baseStyle,
      background: 'transparent',
      border: `1px dashed ${selected ? '#4a9eff' : 'transparent'}`,
      color: data.color || '#aaa',
      fontSize: data.fontSize || 13,
      width: '100%',
      height: '100%',
    }}>
      <NodeResizer minWidth={60} minHeight={20} isVisible={selected} color="#4a9eff" />
      <EditableLabel label={data.label} onChange={data.onLabelChange} />
    </div>
  )
}

export const nodeTypes = {
  rect: RectNode,
  rounded: RoundedNode,
  diamond: DiamondNode,
  cylinder: CylinderNode,
  text: TextNode,
}
