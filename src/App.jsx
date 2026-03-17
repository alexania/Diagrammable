import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { nodeTypes } from './nodeTypes.jsx'
import { edgeTypes } from './edges.jsx'
import Toolbar from './Toolbar.jsx'
import { exportToSvg } from './exportSvg.js'

let nodeId = 1
const newId = () => `n${nodeId++}`

const DEFAULT_NODES = [
  {
    id: 'n1',
    type: 'rect',
    position: { x: 200, y: 150 },
    data: { label: 'API Gateway' },
    width: 140,
    height: 50,
  },
  {
    id: 'n2',
    type: 'rounded',
    position: { x: 420, y: 150 },
    data: { label: 'Auth Service' },
    width: 140,
    height: 50,
  },
  {
    id: 'n3',
    type: 'cylinder',
    position: { x: 420, y: 280 },
    data: { label: 'User DB' },
    width: 120,
    height: 70,
  },
]
nodeId = 4

const DEFAULT_EDGES = [
  { id: 'e1-2', source: 'n1', target: 'n2', label: 'auth request', type: 'waypoint' },
  { id: 'e2-3', source: 'n2', target: 'n3', label: 'query', type: 'waypoint' },
]

function DiagramEditor() {
  const [nodes, setNodes] = useState(DEFAULT_NODES)
  const [edges, setEdges] = useState(DEFAULT_EDGES)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const { screenToFlowPosition } = useReactFlow()
  const containerRef = useRef(null)

  // Wire label change callbacks into node data
  const nodesWithCallbacks = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      onLabelChange: (label) => {
        setNodes(ns => ns.map(x => x.id === n.id ? { ...x, data: { ...x.data, label } } : x))
      },
    },
  }))

  const onNodesChange = useCallback(
    (changes) => setNodes(ns => applyNodeChanges(changes, ns)),
    []
  )
  const onEdgesChange = useCallback(
    (changes) => {
      setEdges(es => applyEdgeChanges(changes, es))
      setSelectedEdge(null)
    },
    []
  )
  const onConnect = useCallback(
    (params) => setEdges(es => addEdge({ ...params, type: 'waypoint', style: { stroke: '#888' } }, es)),
    []
  )

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdge(edge)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null)
  }, [])

  const onAddNode = useCallback((type) => {
    const center = screenToFlowPosition({
      x: (containerRef.current?.clientWidth || 600) / 2,
      y: (containerRef.current?.clientHeight || 400) / 2,
    })
    const defaults = {
      rect: { width: 140, height: 50, label: 'Service' },
      rounded: { width: 140, height: 50, label: 'Service' },
      diamond: { width: 100, height: 100, label: 'Decision' },
      cylinder: { width: 120, height: 70, label: 'Database' },
      text: { width: 120, height: 30, label: 'Label' },
    }
    const d = defaults[type]
    const id = newId()
    setNodes(ns => [...ns, {
      id,
      type,
      position: {
        x: center.x - d.width / 2 + (Math.random() - 0.5) * 40,
        y: center.y - d.height / 2 + (Math.random() - 0.5) * 40,
      },
      data: { label: d.label },
      width: d.width,
      height: d.height,
    }])
  }, [screenToFlowPosition])

  const onDeleteSelected = useCallback(() => {
    setNodes(ns => ns.filter(n => !n.selected))
    setEdges(es => es.filter(e => !e.selected))
    setSelectedEdge(null)
  }, [])

  const onKeyDown = useCallback((e) => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    onDeleteSelected()
  }, [onDeleteSelected])

  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const onEdgeLabelChange = useCallback((id, label) => {
    setEdges(es => es.map(e => e.id === id ? { ...e, label } : e))
    setSelectedEdge(prev => prev?.id === id ? { ...prev, label } : prev)
  }, [])

  const onClear = useCallback(() => {
    if (confirm('Clear all nodes and edges?')) {
      setNodes([])
      setEdges([])
      setSelectedEdge(null)
    }
  }, [])

  const onExport = useCallback(() => {
    const svgStr = exportToSvg(nodes, edges)
    if (!svgStr) { alert('Nothing to export.'); return }
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges])

  // Highlight selected edge
  const styledEdges = edges.map(e => ({
    ...e,
    style: {
      ...(e.style || {}),
      stroke: selectedEdge?.id === e.id ? '#4a9eff' : (e.style?.stroke || '#888'),
      strokeWidth: selectedEdge?.id === e.id ? 2.5 : (e.style?.strokeWidth || 1.5),
    },
    labelStyle: { fill: '#bbb', fontSize: 11 },
    labelBgStyle: { fill: '#1a1a1a' },
  }))

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        onAddNode={onAddNode}
        onExport={onExport}
        onClear={onClear}
        selectedEdge={selectedEdge}
        onEdgeLabelChange={onEdgeLabelChange}
        onDeleteSelected={onDeleteSelected}
      />
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          deleteKeyCode={null}
          style={{ background: '#0f0f0f' }}
          defaultEdgeOptions={{ type: 'waypoint', style: { stroke: '#888', strokeWidth: 1.5 }, labelStyle: { fill: '#bbb', fontSize: 11 }, labelBgStyle: { fill: '#1a1a1a' } }}
        >
          <Background color="#222" gap={24} size={1} />
          <Controls style={{ background: '#1a1a1a', borderColor: '#333', color: '#888' }} />
          <MiniMap
            nodeColor={n => n.data?.bg || '#1e2a3a'}
            style={{ background: '#181818', border: '1px solid #2a2a2a' }}
            maskColor="rgba(0,0,0,0.5)"
          />
        </ReactFlow>
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: '#444',
          pointerEvents: 'none',
        }}>
          Drag to connect · Double-click label to edit · Double-click edge to add anchor · Double-click anchor to remove
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <DiagramEditor />
    </ReactFlowProvider>
  )
}
