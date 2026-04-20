import { useState, useRef, useEffect } from 'react';
import { X, Calendar, Tag, Users, Folder, Clock, Paperclip, MessageCircle, Activity, Trash2, Copy, Check, ChevronDown, Upload } from 'lucide-react';
import { TeamAvatar } from './TeamAvatar';
import { StatusPill } from './StatusPill';
import { PriorityIndicator } from './PriorityIndicator';
import { useTasksContext } from '../../lib/TasksContext';

interface TaskDetailPanelProps {
  task: any;
  onClose: () => void;
  onUpdate?: (updates: any) => void;
  onDelete?: () => void;
}

const teamMembers = ['Arthur', 'Yasmim', 'Alexandre', 'Nikolas'] as const;
const groups = ['Operacional', 'Desenvolvimento', 'Financeiro'] as const;

export function TaskDetailPanel({ task, onClose, onUpdate, onDelete }: TaskDetailPanelProps) {
  const { deleteTask, updateTask } = useTasksContext();
  const [title, setTitle] = useState(task.name);
  const [description, setDescription] = useState(task.description || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'comments'>('comments');
  const [newComment, setNewComment] = useState('');
  const [assignee, setAssignee] = useState(task.assignee);
  const [date, setDate] = useState(task.date);
  const [group, setGroup] = useState(task.group);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [status, setStatus] = useState(task.status);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean; assignee: typeof teamMembers[number] | null }[]>([]);

  interface CommentItem {
    id: string;
    user: typeof teamMembers[number];
    text: string;
    time: string;
    replies: CommentItem[];
  }
  const [comments, setComments] = useState<CommentItem[]>([]);

  const activities: { id: string; user: typeof teamMembers[number]; action: string; value: string; time: string }[] = [];

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const totalSubtasks = subtasks.length;
  const progressPercentage = (completedSubtasks / totalSubtasks) * 100;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowAssigneeDropdown(false);
        setShowGroupDropdown(false);
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: CommentItem = {
      id: Date.now().toString(),
      user: assignee as typeof teamMembers[number],
      text: newComment.trim(),
      time: 'agora',
      replies: [],
    };
    setComments(prev => [...prev, comment]);
    setNewComment('');
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { type: 'success', message: 'Comentário adicionado!' }
    }));
  };

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;
    const reply: CommentItem = {
      id: Date.now().toString(),
      user: assignee as typeof teamMembers[number],
      text: replyText.trim(),
      time: 'agora',
      replies: [],
    };
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
    ));
    setReplyText('');
    setReplyingTo(null);
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { type: 'success', message: 'Resposta adicionada!' }
    }));
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s =>
      s.id === id ? { ...s, completed: !s.completed } : s
    ));
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask = {
        id: Date.now().toString(),
        title: newSubtaskTitle,
        completed: false,
        assignee: null,
      };
      setSubtasks([...subtasks, newSubtask]);
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { type: 'success', message: 'Subtarefa adicionada!' }
      }));
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim() && !tags.includes(newTagName)) {
      setTags([...tags, newTagName]);
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { type: 'success', message: `Tag "${newTagName}" adicionada!` }
      }));
      setNewTagName('');
      setShowAddTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { type: 'success', message: 'Tag removida!' }
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(file => ({
        id: Date.now().toString() + file.name,
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type,
      }));
      setAttachments([...attachments, ...newAttachments]);
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { type: 'success', message: `${files.length} arquivo(s) anexado(s)!` }
      }));
    }
  };

  const handleMarkComplete = async () => {
    const newStatus = status === 'Concluído' ? 'Em Andamento' : 'Concluído';
    await updateTask(task.id, { status: newStatus });
    setStatus(newStatus);
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        type: 'success',
        message: newStatus === 'Concluído' ? 'Tarefa marcada como concluída!' : 'Tarefa reaberta!'
      }
    }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-card shadow-2xl z-50 flex flex-col animate-in slide-in-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-[#6B7280] mb-2">
                {task.group} › Tarefa
              </p>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="text-2xl font-bold text-[#111827] w-full border-b-2 border-[#4A9EDB] focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="text-2xl font-bold text-[#111827] cursor-pointer hover:text-[#4A9EDB] transition-all"
                >
                  {title}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <StatusPill status={status} />
            <PriorityIndicator priority={task.priority} />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative dropdown-container">
                <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-2">
                  <Users size={16} />
                  Responsável
                </label>
                <button
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="w-full flex items-center justify-between gap-2 p-2 border border-gray-200 rounded-lg hover:border-[#4A9EDB] cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <TeamAvatar member={assignee} size="sm" showName />
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {showAssigneeDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {teamMembers.map((member) => (
                      <button
                        key={member}
                        onClick={() => {
                          setAssignee(member);
                          setShowAssigneeDropdown(false);
                          window.dispatchEvent(new CustomEvent('showToast', {
                            detail: { type: 'success', message: `Responsável alterado para ${member}` }
                          }));
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-all first:rounded-t-lg last:rounded-b-lg"
                      >
                        <TeamAvatar member={member} size="sm" showName />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative dropdown-container">
                <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-2">
                  <Calendar size={16} />
                  Prazo
                </label>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-[#4A9EDB] cursor-pointer transition-all"
                >
                  <span className="text-sm text-[#111827]">{date}</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {showDatePicker && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <input
                      type="date"
                      value=""
                      onChange={(e) => {
                        const formattedDate = new Date(e.target.value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                        setDate(formattedDate);
                        setShowDatePicker(false);
                        window.dispatchEvent(new CustomEvent('showToast', {
                          detail: { type: 'success', message: `Prazo alterado para ${formattedDate}` }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB]"
                    />
                  </div>
                )}
              </div>

              <div className="relative dropdown-container">
                <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-2">
                  <Folder size={16} />
                  Grupo
                </label>
                <button
                  onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                  className="w-full flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-[#4A9EDB] cursor-pointer transition-all"
                >
                  <span className="text-sm text-[#111827]">{group}</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {showGroupDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {groups.map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setGroup(g);
                          setShowGroupDropdown(false);
                          window.dispatchEvent(new CustomEvent('showToast', {
                            detail: { type: 'success', message: `Grupo alterado para ${g}` }
                          }));
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-all first:rounded-t-lg last:rounded-b-lg"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#6B7280] mb-2">
                  <Tag size={16} />
                  Tags
                </label>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-[#4A9EDB] text-xs rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 transition-all"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {showAddTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        onBlur={() => setShowAddTag(false)}
                        placeholder="Nova tag..."
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-24 focus:outline-none focus:ring-1 focus:ring-[#4A9EDB]"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddTag(true)}
                      className="px-2 py-1 border border-dashed border-gray-300 text-xs rounded-full hover:border-[#4A9EDB] hover:text-[#4A9EDB] transition-all"
                    >
                      + Adicionar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Created/Updated Info */}
            <div className="grid grid-cols-2 gap-4 text-xs text-[#6B7280]">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Responsável: <strong>{assignee}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Prazo: {date}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição detalhada..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] resize-none"
              />
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-[#111827]">
                  Subtarefas
                </label>
                <button
                  onClick={() => setShowAddSubtask(true)}
                  className="text-sm text-[#4A9EDB] hover:underline"
                >
                  + Adicionar
                </button>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                  <span>{completedSubtasks} de {totalSubtasks} concluídas</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22C55E] transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Subtask List */}
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(subtask.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#4A9EDB] focus:ring-[#4A9EDB]"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        subtask.completed ? 'line-through text-gray-400' : 'text-[#111827]'
                      }`}
                    >
                      {subtask.title}
                    </span>
                    {subtask.assignee && (
                      <TeamAvatar member={subtask.assignee} size="sm" />
                    )}
                  </div>
                ))}

                {/* Add Subtask Input */}
                {showAddSubtask && (
                  <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                      placeholder="Título da subtarefa..."
                      className="flex-1 text-sm focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleAddSubtask}
                      className="px-3 py-1 bg-[#1E3A5F] text-white rounded text-xs hover:opacity-90"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => {
                        setShowAddSubtask(false);
                        setNewSubtaskTitle('');
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-[#111827]">
                  <Paperclip size={16} />
                  Anexos ({attachments.length})
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-[#4A9EDB] hover:underline flex items-center gap-1"
                >
                  <Upload size={14} />
                  Upload
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {attachments.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip size={16} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-[#111827]">{file.name}</p>
                          <p className="text-xs text-[#6B7280]">{file.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAttachments(attachments.filter(a => a.id !== file.id));
                          window.dispatchEvent(new CustomEvent('showToast', {
                            detail: { type: 'success', message: 'Anexo removido!' }
                          }));
                        }}
                        className="text-red-600 hover:bg-red-50 rounded p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#4A9EDB] hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <Paperclip className="mx-auto text-gray-400 mb-2" size={24} />
                <p className="text-sm text-[#6B7280]">
                  Arraste arquivos aqui ou clique para fazer upload
                </p>
              </button>
            </div>

            {/* Activity / Comments Tabs */}
            <div>
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-all ${
                    activeTab === 'comments'
                      ? 'border-[#4A9EDB] text-[#4A9EDB]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle size={16} className="inline mr-2" />
                  Comentários ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-all ${
                    activeTab === 'activity'
                      ? 'border-[#4A9EDB] text-[#4A9EDB]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Activity size={16} className="inline mr-2" />
                  Atividade
                </button>
              </div>

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* Comment List */}
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <TeamAvatar member={comment.user} size="sm" />
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-[#111827]">
                              {comment.user}
                            </span>
                            <span className="text-xs text-[#6B7280]">{comment.time}</span>
                          </div>
                          <p className="text-sm text-[#111827]">{comment.text}</p>
                        </div>
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-xs text-[#6B7280] hover:text-[#4A9EDB] mt-1 transition-all"
                        >
                          {replyingTo === comment.id ? 'Cancelar' : 'Responder'}
                        </button>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="mt-3 ml-8 space-y-2">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="flex gap-2">
                                <TeamAvatar member={reply.user} size="sm" />
                                <div className="flex-1 bg-gray-50 rounded-lg p-2.5">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-xs text-[#111827]">{reply.user}</span>
                                    <span className="text-xs text-[#6B7280]">{reply.time}</span>
                                  </div>
                                  <p className="text-xs text-[#111827]">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 ml-8">
                            <div className="flex gap-2">
                              <TeamAvatar member={assignee} size="sm" />
                              <div className="flex-1">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Respondendo a ${comment.user}...`}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] resize-none text-sm"
                                  autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleAddReply(comment.id)}
                                    disabled={!replyText.trim()}
                                    className="px-3 py-1 bg-[#1E3A5F] text-white rounded text-xs hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Responder
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* New Comment */}
                  <div className="flex gap-3">
                    <TeamAvatar member={assignee} size="sm" />
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Adicionar comentário..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A9EDB] resize-none"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 items-start">
                      <TeamAvatar member={activity.user} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm text-[#111827]">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-[#6B7280]">{activity.action}</span>{' '}
                          {activity.value && (
                            <span className="font-medium">{activity.value}</span>
                          )}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex items-center gap-3 flex-shrink-0 bg-white">
          <button
            onClick={async () => {
              if (confirm('Deseja realmente excluir esta tarefa?')) {
                if (task.id) await deleteTask(task.id);
                onDelete?.();
                onClose();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={16} />
            <span className="text-sm">Excluir</span>
          </button>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('showToast', {
                detail: { type: 'success', message: 'Tarefa duplicada!' }
              }));
            }}
            className="flex items-center gap-2 px-4 py-2 text-[#6B7280] hover:bg-gray-100 rounded-lg transition-all"
          >
            <Copy size={16} />
            <span className="text-sm">Duplicar</span>
          </button>

          <div className="flex-1" />

          <button
            onClick={handleMarkComplete}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg hover:opacity-90 transition-all text-white ${
              status === 'Concluído' ? 'bg-slate-500' : 'bg-[#22C55E]'
            }`}
          >
            <Check size={16} />
            <span className="text-sm font-medium">
              {status === 'Concluído' ? 'Reabrir Tarefa' : 'Marcar Concluída'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
