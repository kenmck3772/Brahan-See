
import React, { useState } from 'react';
import { PenTool, Send, Trash2, Link as LinkIcon, FileText, Activity, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProvenanceTooltip from './ProvenanceTooltip';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  wellId: string;
  timestamp: string;
  status: 'DRAFT' | 'PUBLISHED';
}

const ForensicBlog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([
    { id: '1', title: 'Water Breakthrough in Stella Well S1', content: 'Forensic audit of pressure data suggests early water breakthrough not reported in NSTA Q1 filings.', wellId: 'STELLA-01', timestamp: '2024-02-10', status: 'PUBLISHED' },
    { id: '2', title: 'Viking V1 Geolocation Discordance', content: 'Wellhead survey shows 1.2km drift from reported coordinates. Physical audit confirmed.', wellId: 'VIKING-01', timestamp: '2023-11-25', status: 'PUBLISHED' },
  ]);

  const [newPost, setNewPost] = useState({ title: '', content: '', wellId: '' });
  const [isWriting, setIsWriting] = useState(false);

  const handlePublish = () => {
    if (!newPost.title || !newPost.content) return;

    const post: BlogPost = {
      id: Date.now().toString(),
      ...newPost,
      timestamp: new Date().toISOString().split('T')[0],
      status: 'PUBLISHED',
    };

    setPosts([post, ...posts]);
    setNewPost({ title: '', content: '', wellId: '' });
    setIsWriting(false);

    // Dispatch event for KnowledgeGraph to pick up
    window.dispatchEvent(new CustomEvent('FORENSIC_BLOG_PUBLISHED', { detail: post }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden glass-panel cyber-border">
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PenTool size={18} className="text-blue-500" />
          <span className="text-xs font-black uppercase tracking-widest text-white">Forensic Blog // Knowledge Base</span>
        </div>
        <button 
          onClick={() => setIsWriting(!isWriting)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
        >
          {isWriting ? 'Cancel' : 'New Audit Blog'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {isWriting && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-slate-900/50 border border-blue-500/30 rounded-xl space-y-3"
            >
              <input 
                type="text" 
                placeholder="Audit Title (e.g., Water Breakthrough in Stella)"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-blue-500 outline-none transition-all"
              />
              <select 
                value={newPost.wellId}
                onChange={(e) => setNewPost({ ...newPost, wellId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-400 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select Target Well</option>
                <option value="STELLA-01">Stella 30/06a</option>
                <option value="VIKING-01">Viking V1</option>
                <option value="GANNET-01">Gannet A</option>
              </select>
              <textarea 
                placeholder="Forensic interpretation and physics-anchored findings..."
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 h-32 focus:border-blue-500 outline-none transition-all resize-none"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handlePublish}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                >
                  <Send size={14} />
                  <span>Publish to WellArk</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {posts.map(post => (
          <div key={post.id} className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <FileText size={14} className="text-blue-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-tight">{post.title}</h4>
              </div>
              <span className="text-[8px] font-mono text-slate-500">{post.timestamp}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-3 line-clamp-3 italic">
              "{post.content}"
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
              <div className="flex items-center space-x-3">
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  WELL: {post.wellId}
                </span>
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  STATUS: {post.status}
                </span>
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ProvenanceTooltip 
                  source="WellTegra Forensic Engine" 
                  validator="BRAHAN_ARCHITECT" 
                  timestamp={post.timestamp}
                >
                  <ShieldCheck size={14} className="text-emerald-500 cursor-help" />
                </ProvenanceTooltip>
                <button className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForensicBlog;
