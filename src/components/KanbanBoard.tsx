import React, { useState, useMemo } from 'react';
import { ActionItem } from '../types';
import { GripVertical, X, Search, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface KanbanBoardProps {
  items: ActionItem[];
  canEdit: boolean;
  onItemMove: (itemId: string, newAssignee: string) => void;
  onItemUpdate: (itemId: string, updates: Partial<ActionItem>) => void;
  onItemDelete: (itemId: string) => void;
}

export function KanbanBoard({ items, canEdit, onItemMove, onItemUpdate, onItemDelete }: KanbanBoardProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // The actual selected item derived from the items array
  const selectedItem = items.find(i => i.id === selectedItemId) || null;

  // Extract unique assignees for columns
  const rawAssignees = Array.from(new Set(items.map((i) => i.assignee)));
  // Ensure we sort of keep 'Unassigned' at the end or clearly visible
  const assignees = rawAssignees.sort((a, b) => {
    if (a === 'Unassigned') return 1;
    if (b === 'Unassigned') return -1;
    return a.localeCompare(b);
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, assignee: string) => {
    e.preventDefault();
    if (!canEdit) return;
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) {
      onItemMove(itemId, assignee);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (name === 'Unassigned') return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getPriorityColor = (priority?: string) => {
    const p = (priority || '').toLowerCase();
    if (p.includes('high') || p.includes('urgent')) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
    if (p.includes('medium')) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
    if (p.includes('low')) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const query = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(query) || item.assignee.toLowerCase().includes(query);
    });
  }, [items, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-900 relative transition-colors">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 shadow-sm z-10 sticky top-0 transition-colors">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by title or assignee..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {!items || items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 min-h-[400px] m-4 transition-colors">
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No action items to display.</p>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto overflow-y-hidden items-start w-full flex-1 p-4">
          {assignees.map((assignee, colIndex) => {
            const avatarColors = [
              'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300',
              'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
              'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300',
              'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
            ];
            const colorClass = avatarColors[colIndex % avatarColors.length];

            return (
              <div
                key={assignee}
                className="flex-shrink-0 w-[300px] flex flex-col h-full min-h-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, assignee)}
              >
                <div className="flex items-center gap-3 mb-4 shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${colorClass}`}>
                    <span className="font-bold text-sm">{getInitials(assignee)}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{assignee}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tighter">Participant</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-8 min-h-0 pr-1">
                  {filteredItems
                    .filter((i) => i.assignee === assignee)
                    .map((item) => (
                      <motion.div
                        layoutId={item.id}
                        key={item.id}
                        draggable={canEdit}
                        // motion.div types onDragStart as a pan-gesture handler, but with
                        // `draggable` the browser fires a native HTML5 DragEvent at runtime.
                        onDragStart={(e) => {
                          if (canEdit) handleDragStart(e as unknown as React.DragEvent, item.id);
                        }}
                        className={`bg-white dark:bg-slate-800 flex flex-col gap-2 p-4 rounded-xl shadow-sm border ${item.status === 'completed' ? 'border-transparent opacity-60 bg-slate-50 dark:bg-slate-800/50' : 'border-slate-200 dark:border-slate-700'} ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''} hover:border-slate-300 dark:hover:border-slate-600 transition-all group relative shrink-0`}
                      >
                        {canEdit && (
                          <div className="absolute top-1/2 -translate-y-1/2 left-1 opacity-0 group-hover:opacity-30 transition-opacity">
                            <GripVertical className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getPriorityColor(item.priority)}`}>
                            {item.priority || 'Task'}
                          </span>
                          <input
                            type="checkbox"
                            checked={item.status === 'completed'}
                            disabled={!canEdit}
                            onChange={(e) => onItemUpdate(item.id, { status: e.target.checked ? 'completed' : 'pending' })}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            title="Toggle completed"
                          />
                        </div>
                        <p 
                          className={`mt-1 text-sm font-medium ${item.status === 'completed' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'} cursor-pointer hover:underline`}
                          onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); }}
                        >
                          {item.title}
                        </p>
                        {item.dueDate && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {item.dueDate}</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col transition-colors"
            style={{ maxHeight: 'calc(100vh - 40px)' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getPriorityColor(selectedItem.priority)}`}>
                  {selectedItem.priority || 'Task'}
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItem.status === 'completed'}
                    disabled={!canEdit}
                    onChange={(e) => onItemUpdate(selectedItem.id, { status: e.target.checked ? 'completed' : 'pending' })}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                    {selectedItem.status === 'completed' ? 'Completed' : 'Mark Complete'}
                  </span>
                </label>
              </div>
              <button
                onClick={() => setSelectedItemId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {canEdit ? (
                <input
                  key={selectedItem.id}
                  defaultValue={selectedItem.title}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== selectedItem.title) onItemUpdate(selectedItem.id, { title: v });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="w-full text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 -mx-2 py-1 outline-none transition-colors"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">{selectedItem.title}</h2>
              )}
              
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                    <span className="font-bold text-xs">{getInitials(selectedItem.assignee)}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assigned to</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">{selectedItem.assignee}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Due Date</p>
                    <input
                      type="date"
                      value={selectedItem.dueDate || ''}
                      disabled={!canEdit}
                      onChange={(e) => onItemUpdate(selectedItem.id, { dueDate: e.target.value })}
                      className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 max-w-[200px] disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Description / Context</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.description || "No detailed description was extracted from the transcript."}
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
              {canEdit ? (
                <button
                  onClick={() => {
                    onItemDelete(selectedItem.id);
                    setSelectedItemId(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={() => setSelectedItemId(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
