import React from 'react'

const NODE_TYPES = [
  { type: 'rect', label: 'Box', title: 'Rectangle' },
  { type: 'rounded', label: '(  )', title: 'Rounded / Service' },
  { type: 'diamond', label: '<>', title: 'Decision' },
  { type: 'cylinder', label: '⊎', title: 'Database / Storage' },
  { type: 'text', label: 'T', title: 'Text label' },
]

export default function Toolbar({ onAddNode, onExport, onClear, selectedEdge, onEdgeLabelChange, onDeleteSelected }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      background: '#181818',
      borderBottom: '1px solid #2a2a2a',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#888', marginRight: 4 }}>Add:</span>
      {NODE_TYPES.map(({ type, label, title }) => (
        <button
          key={type}
          title={title}
          onClick={() => onAddNode(type)}
          style={btnStyle}
        >
          {label}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {selectedEdge && (
        <input
          type="text"
          placeholder="Edge label…"
          defaultValue={selectedEdge.label || ''}
          onBlur={e => onEdgeLabelChange(selectedEdge.id, e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onEdgeLabelChange(selectedEdge.id, e.target.value) }}
          style={{
            background: '#222',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#e8e8e8',
            padding: '4px 8px',
            fontSize: 12,
            width: 160,
          }}
        />
      )}

      <button onClick={onDeleteSelected} title="Delete selected (Del)" style={{ ...btnStyle, color: '#e06c6c' }}>
        Delete
      </button>
      <button onClick={onClear} title="Clear all" style={{ ...btnStyle, color: '#888' }}>
        Clear
      </button>
      <button onClick={onExport} title="Export as SVG" style={{ ...btnStyle, background: '#1a3a1a', borderColor: '#3a6a3a', color: '#7adb7a' }}>
        Export SVG
      </button>
    </div>
  )
}

const btnStyle = {
  background: '#222',
  border: '1px solid #333',
  borderRadius: 4,
  color: '#e8e8e8',
  padding: '4px 10px',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
