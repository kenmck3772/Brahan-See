
import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import { Share2, Link as LinkIcon, FileText, Activity, Target } from 'lucide-react';
import { useUnit } from '../src/context/UnitContext';
import { useTemporal } from '../src/context/TemporalContext';

interface Node {
  id: string;
  type: 'WELL' | 'BLOG' | 'MODEL' | 'EVENT';
  label: string;
  x: number;
  y: number;
  data?: any;
}

interface Edge {
  id: string;
  from: string;
  to: string;
  label: string;
}

const KnowledgeGraph: React.FC = () => {
  const { year } = useTemporal();
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'well-stella', type: 'WELL', label: 'Stella 30/06a', x: 200, y: 200 },
    { id: 'well-viking', type: 'WELL', label: 'Viking V1', x: 400, y: 300 },
    { id: 'well-gannet', type: 'WELL', label: 'Gannet A', x: 100, y: 400 },
    { id: 'blog-stella-water', type: 'BLOG', label: 'Water Breakthrough Audit', x: 350, y: 150, data: { date: '2024-02-10' } },
    { id: 'model-stella-physics', type: 'MODEL', label: 'Mass-Balance v1.2', x: 150, y: 100 },
  ]);

  const [edges, setEdges] = useState<Edge[]>([
    { id: 'e1', from: 'blog-stella-water', to: 'well-stella', label: 'Discusses' },
    { id: 'e2', from: 'model-stella-physics', to: 'well-stella', label: 'Validates' },
    { id: 'e3', from: 'blog-stella-water', to: 'model-stella-physics', label: 'References' },
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const handleBlogPublished = (e: any) => {
      const post = e.detail;
      const newNode: Node = {
        id: `blog-${post.id}`,
        type: 'BLOG',
        label: post.title,
        x: Math.random() * (dimensions.width - 100) + 50,
        y: Math.random() * (dimensions.height - 100) + 50,
        data: { date: post.timestamp },
      };

      setNodes(prev => [...prev, newNode]);

      // Find target well node
      const wellNode = nodes.find(n => n.id.includes(post.wellId.toLowerCase()));
      if (wellNode) {
        setEdges(prev => [...prev, {
          id: `edge-${post.id}`,
          from: newNode.id,
          to: wellNode.id,
          label: 'Discusses',
        }]);
      }
    };

    window.addEventListener('FORENSIC_BLOG_PUBLISHED', handleBlogPublished);
    return () => window.removeEventListener('FORENSIC_BLOG_PUBLISHED', handleBlogPublished);
  }, [dimensions, nodes]);

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter nodes based on year (simulation)
  const visibleNodes = nodes.filter(node => {
    if (node.type === 'BLOG' && node.data?.date) {
      const nodeYear = new Date(node.data.date).getFullYear();
      return nodeYear <= year;
    }
    return true;
  });

  const visibleEdges = edges.filter(edge => 
    visibleNodes.find(n => n.id === edge.from) && 
    visibleNodes.find(n => n.id === edge.to)
  );

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'WELL': return '#10b981'; // emerald
      case 'BLOG': return '#3b82f6'; // blue
      case 'MODEL': return '#d946ef'; // fuchsia
      case 'EVENT': return '#f59e0b'; // amber
      default: return '#94a3b8';
    }
  };

  return (
    <div ref={containerRef} className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative glass-panel cyber-border">
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-3 bg-slate-900/80 border border-slate-800 p-2 rounded-lg backdrop-blur-sm">
        <Share2 size={16} className="text-fuchsia-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white">WellArk // Knowledge Graph</span>
      </div>

      <Stage width={dimensions.width} height={dimensions.height}>
        <Layer>
          {/* Edges */}
          {visibleEdges.map(edge => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <Group key={edge.id}>
                <Line
                  points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                  stroke="#334155"
                  strokeWidth={1}
                  dash={[5, 5]}
                />
                <Text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2}
                  text={edge.label}
                  fontSize={8}
                  fill="#64748b"
                  fontFamily="monospace"
                  align="center"
                />
              </Group>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map(node => (
            <Group 
              key={node.id} 
              x={node.x} 
              y={node.y}
              draggable
              onDragMove={(e) => {
                const newNodes = nodes.map(n => 
                  n.id === node.id ? { ...n, x: e.target.x(), y: e.target.y() } : n
                );
                setNodes(newNodes);
              }}
              onClick={() => setSelectedNode(node.id)}
            >
              <Circle
                radius={selectedNode === node.id ? 25 : 20}
                fill={getNodeColor(node.type)}
                opacity={0.2}
                stroke={getNodeColor(node.type)}
                strokeWidth={1}
              />
              <Circle
                radius={5}
                fill={getNodeColor(node.type)}
                shadowBlur={10}
                shadowColor={getNodeColor(node.type)}
              />
              <Text
                text={node.label}
                y={25}
                fontSize={10}
                fill="white"
                fontFamily="sans-serif"
                align="center"
                offsetX={40}
                width={80}
              />
              <Text
                text={node.type}
                y={38}
                fontSize={7}
                fill="#64748b"
                fontFamily="monospace"
                align="center"
                offsetX={40}
                width={80}
                fontStyle="bold"
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-sm z-10 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[8px] font-black text-slate-400 uppercase">Well Asset</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-[8px] font-black text-slate-400 uppercase">Forensic Blog</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div>
          <span className="text-[8px] font-black text-slate-400 uppercase">Physics Model</span>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
