
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ChevronRight, Folder, File, ArrowLeft, X, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../src/context/ThemeContext';

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  children?: FileNode[];
}

const MOCK_FS: FileNode[] = [];

const BrahanPersonalTerminal: React.FC = () => {
  const { theme } = useTheme();
  const [fs, setFs] = useState<FileNode[]>(MOCK_FS);
  const [history, setHistory] = useState<{ type: 'input' | 'output' | 'error', text: string | React.ReactNode }[]>([
    { type: 'output', text: 'BRAHAN_PERSONAL_TERMINAL v2.5.0' },
    { type: 'output', text: 'Sovereign Audit Environment Initialized.' },
    { type: 'output', text: 'Type "help" for a list of available commands.' },
  ]);
  const [wellFiles, setWellFiles] = useState(0);
  const [input, setInput] = useState('');

  useEffect(() => {
    const handlePurge = () => {
      setWellFiles(0);
      setHistory(prev => [...prev, { type: 'output', text: 'SYSTEM_ALERT: Well files purged from Sovereign Vault.' }]);
    };
    window.addEventListener('WELL_FILES_PURGED', handlePurge);
    return () => window.removeEventListener('WELL_FILES_PURGED', handlePurge);
  }, []);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const resolveNode = (pathArr: string[], root: FileNode[] = fs): FileNode[] | null => {
    let current = root;
    for (const segment of pathArr) {
      const found = current.find(n => n.name === segment && n.type === 'dir');
      if (found && found.children) {
        current = found.children;
      } else {
        return null;
      }
    }
    return current;
  };

  const getCurrentDir = () => {
    return resolveNode(currentPath) || [];
  };

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    const parts = trimmedCmd.split(/\s+/);
    const action = parts[0].toLowerCase();
    const args = parts.slice(1);

    setCommandHistory(prev => [trimmedCmd, ...prev]);
    setHistoryIndex(-1);

    const promptPath = currentPath.length === 0 ? '~' : '/' + currentPath.join('/');
    setHistory(prev => [...prev, { type: 'input', text: `brahan@sovereign:${promptPath}$ ${trimmedCmd}` }]);

    switch (action) {
      case 'help':
        setHistory(prev => [...prev, { type: 'output', text: (
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
            <span className="text-emerald-400">ls [path]</span><span>List directory contents</span>
            <span className="text-emerald-400">cd [path]</span><span>Change directory</span>
            <span className="text-emerald-400">pwd</span><span>Print working directory</span>
            <span className="text-emerald-400">cat [file]</span><span>View file contents</span>
            <span className="text-emerald-400">mkdir [name]</span><span>Create directory</span>
            <span className="text-emerald-400">touch [name]</span><span>Create empty file</span>
            <span className="text-emerald-400">rm [name]</span><span>Remove file or directory</span>
            <span className="text-emerald-400">clear</span><span>Clear terminal history</span>
            <span className="text-emerald-400">whoami</span><span>Display current user identity</span>
            <span className="text-emerald-400">purge-well</span><span>Clear un-audited legacy well files</span>
          </div>
        ) }]);
        break;

      case 'purge-well':
        if (wellFiles === 0) {
          setHistory(prev => [...prev, { type: 'output', text: 'No well files found in vault.' }]);
        } else {
          setHistory(prev => [...prev, { type: 'output', text: `Purging ${wellFiles} well files...` }]);
          setTimeout(() => {
            setWellFiles(0);
            window.dispatchEvent(new CustomEvent('WELL_FILES_PURGED'));
            setHistory(prev => [...prev, { type: 'output', text: 'Purge complete. Sovereign Vault is clean.' }]);
          }, 1500);
        }
        break;

      case 'ls': {
        let targetPath = [...currentPath];
        if (args[0]) {
          if (args[0].startsWith('/')) {
            targetPath = args[0].split('/').filter(Boolean);
          } else {
            const segments = args[0].split('/').filter(Boolean);
            for (const s of segments) {
              if (s === '..') targetPath.pop();
              else if (s !== '.') targetPath.push(s);
            }
          }
        }
        
        const dir = resolveNode(targetPath);
        if (dir) {
          setHistory(prev => [...prev, { type: 'output', text: (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {dir.map(node => (
                <div key={node.name} className="flex items-center space-x-1">
                  {node.type === 'dir' ? <Folder size={12} className="text-blue-400" /> : <File size={12} className="text-slate-400" />}
                  <span className={node.type === 'dir' ? 'text-blue-400 font-bold' : 'text-slate-200'}>{node.name}</span>
                </div>
              ))}
              {dir.length === 0 && <span className="text-slate-500 italic">empty directory</span>}
            </div>
          ) }]);
        } else {
          setHistory(prev => [...prev, { type: 'error', text: `ls: cannot access '${args[0]}': No such file or directory` }]);
        }
        break;
      }

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          setCurrentPath([]);
        } else {
          let newPath = [...currentPath];
          if (args[0].startsWith('/')) {
            newPath = args[0].split('/').filter(Boolean);
          } else {
            const segments = args[0].split('/').filter(Boolean);
            for (const s of segments) {
              if (s === '..') {
                if (newPath.length > 0) newPath.pop();
              } else if (s !== '.') {
                newPath.push(s);
              }
            }
          }
          
          if (resolveNode(newPath)) {
            setCurrentPath(newPath);
          } else {
            setHistory(prev => [...prev, { type: 'error', text: `cd: no such directory: ${args[0]}` }]);
          }
        }
        break;
      }

      case 'pwd':
        setHistory(prev => [...prev, { type: 'output', text: currentPath.length === 0 ? '/' : '/' + currentPath.join('/') }]);
        break;

      case 'mkdir': {
        if (!args[0]) {
          setHistory(prev => [...prev, { type: 'error', text: 'mkdir: missing operand' }]);
          break;
        }
        const name = args[0];
        const currentDir = getCurrentDir();
        if (currentDir.find(n => n.name === name)) {
          setHistory(prev => [...prev, { type: 'error', text: `mkdir: cannot create directory '${name}': File exists` }]);
        } else {
          const newNode: FileNode = { name, type: 'dir', children: [] };
          const updateFs = (nodes: FileNode[], path: string[]): FileNode[] => {
            if (path.length === 0) return [...nodes, newNode];
            return nodes.map(node => {
              if (node.name === path[0] && node.type === 'dir') {
                return { ...node, children: updateFs(node.children || [], path.slice(1)) };
              }
              return node;
            });
          };
          setFs(prev => updateFs(prev, currentPath));
          setHistory(prev => [...prev, { type: 'output', text: `Directory created: ${name}` }]);
        }
        break;
      }

      case 'touch': {
        if (!args[0]) {
          setHistory(prev => [...prev, { type: 'error', text: 'touch: missing operand' }]);
          break;
        }
        const name = args[0];
        const currentDir = getCurrentDir();
        if (currentDir.find(n => n.name === name)) {
          // Update timestamp or just do nothing for mock
          setHistory(prev => [...prev, { type: 'output', text: `Updated timestamp for: ${name}` }]);
        } else {
          const newNode: FileNode = { name, type: 'file', content: '' };
          const updateFs = (nodes: FileNode[], path: string[]): FileNode[] => {
            if (path.length === 0) return [...nodes, newNode];
            return nodes.map(node => {
              if (node.name === path[0] && node.type === 'dir') {
                return { ...node, children: updateFs(node.children || [], path.slice(1)) };
              }
              return node;
            });
          };
          setFs(prev => updateFs(prev, currentPath));
          setHistory(prev => [...prev, { type: 'output', text: `File created: ${name}` }]);
        }
        break;
      }

      case 'rm': {
        if (!args[0]) {
          setHistory(prev => [...prev, { type: 'error', text: 'rm: missing operand' }]);
          break;
        }
        const name = args[0];
        const currentDir = getCurrentDir();
        if (!currentDir.find(n => n.name === name)) {
          setHistory(prev => [...prev, { type: 'error', text: `rm: cannot remove '${name}': No such file or directory` }]);
        } else {
          const updateFs = (nodes: FileNode[], path: string[]): FileNode[] => {
            if (path.length === 0) return nodes.filter(n => n.name !== name);
            return nodes.map(node => {
              if (node.name === path[0] && node.type === 'dir') {
                return { ...node, children: updateFs(node.children || [], path.slice(1)) };
              }
              return node;
            });
          };
          setFs(prev => updateFs(prev, currentPath));
          setHistory(prev => [...prev, { type: 'output', text: `Removed: ${name}` }]);
        }
        break;
      }

      case 'cat':
        if (!args[0]) {
          setHistory(prev => [...prev, { type: 'error', text: 'cat: missing operand' }]);
        } else {
          const file = getCurrentDir().find(n => n.name === args[0] && n.type === 'file');
          if (file) {
            setHistory(prev => [...prev, { type: 'output', text: (
              <pre className="whitespace-pre-wrap font-mono text-[9px] text-emerald-100/70 bg-slate-900/50 p-2 rounded border border-emerald-900/20">
                {file.content || '(empty file)'}
              </pre>
            ) }]);
          } else {
            setHistory(prev => [...prev, { type: 'error', text: `cat: ${args[0]}: No such file` }]);
          }
        }
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'whoami':
        setHistory(prev => [...prev, { type: 'output', text: 'BRAHAN_FORENSIC_ARCHITECT_v9.2' }]);
        break;

      default:
        setHistory(prev => [...prev, { type: 'error', text: `command not found: ${action}` }]);
    }
  };

  return (
    <div className={`flex flex-col transition-all duration-500 border rounded-2xl overflow-hidden shadow-2xl glass-panel cyber-border ${
      isMaximized ? 'fixed inset-6 z-[1000]' : 'h-[500px]'
    }`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-emerald-900/20">
        <div className="flex items-center space-x-3">
          <Terminal size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Brahan_Personal_Terminal // Forensic_CLI</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-emerald-500/10 rounded transition-colors">
            {isMaximized ? <Minimize2 size={14} className="text-emerald-500" /> : <Maximize2 size={14} className="text-emerald-500" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-950/90 p-4 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((entry, i) => (
          <div key={i} className={`break-words ${
            entry.type === 'input' ? 'text-white' : 
            entry.type === 'error' ? 'text-red-400' : 
            'text-emerald-400/80'
          }`}>
            {entry.text}
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <span className="text-emerald-500 font-bold">brahan@sovereign:{currentPath.length === 0 ? '~' : '/' + currentPath.join('/')}$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommand(input);
                setInput('');
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex < commandHistory.length - 1) {
                  const newIndex = historyIndex + 1;
                  setHistoryIndex(newIndex);
                  setInput(commandHistory[newIndex]);
                }
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex > 0) {
                  const newIndex = historyIndex - 1;
                  setHistoryIndex(newIndex);
                  setInput(commandHistory[newIndex]);
                } else if (historyIndex === 0) {
                  setHistoryIndex(-1);
                  setInput('');
                }
              }
            }}
            className="flex-1 bg-transparent border-none outline-none text-white p-0 m-0"
            autoFocus
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-1 bg-slate-950/80 border-t border-emerald-900/20 flex items-center justify-between text-[8px] font-black text-emerald-900 uppercase tracking-widest">
        <span>Sovereign_Audit_Session: ACTIVE</span>
        <span>Path: {currentPath.length === 0 ? '/' : '/' + currentPath.join('/')}</span>
      </div>
    </div>
  );
};

export default BrahanPersonalTerminal;
