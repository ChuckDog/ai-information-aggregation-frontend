'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Globe, 
  FileText, 
  Play, 
  Trash2, 
  AlertCircle,
  Hash,
  Settings,
  Loader2,
  PauseCircle,
  RotateCcw,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Code,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Task } from '@/types';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isUrlsCollapsed, setIsUrlsCollapsed] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      name: '',
      instructions: '',
      urls: ''
  });

  useEffect(() => {
    fetchTask();
    
    // Poll for updates if task is running
    const interval = setInterval(() => {
        if (task?.status === 'running') {
            fetchTask();
        }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, task?.status]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/api/tasks/${id}`);
      setTask(response.data);
      // Update edit form initial state
      if (!isEditing) {
          setEditForm({
              name: response.data.name,
              instructions: response.data.instructions,
              urls: response.data.urls.join('\n')
          });
      }
    } catch (error) {
      console.error('Failed to fetch task', error);
      // alert('Failed to fetch task details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    try {
      await api.post(`/api/tasks/${id}/execute`);
      fetchTask(); // Refresh status
    } catch (error) {
      console.error('Failed to execute task', error);
      alert('Failed to execute task');
    }
  };
  
  const handleRestart = async () => {
      if (confirm('This will clear current progress and restart the task. Continue?')) {
        try {
            await api.post(`/api/tasks/${id}/restart`);
            fetchTask();
        } catch (error) {
            console.error('Failed to restart task', error);
            alert('Failed to restart task');
        }
      }
  }

  const handlePause = async () => {
    try {
      await api.post(`/api/tasks/${id}/pause`);
      fetchTask(); // Refresh status
    } catch (error) {
      console.error('Failed to pause task', error);
      alert('Failed to pause task');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/api/tasks/${id}`);
        router.push('/');
      } catch (error) {
        console.error('Failed to delete task', error);
        alert('Failed to delete task');
      }
    }
  };
  
  const handleSaveEdit = async () => {
      try {
          const urls = editForm.urls.split('\n').map(u => u.trim()).filter(u => u.length > 0);
          await api.patch(`/api/tasks/${id}`, {
              name: editForm.name,
              instructions: editForm.instructions,
              urls: urls
          });
          setIsEditing(false);
          fetchTask();
      } catch (error) {
          console.error('Failed to update task', error);
          alert('Failed to update task');
      }
  }
  
  const handleClearResults = async () => {
      if (confirm('Are you sure you want to clear ALL results history?')) {
          try {
              await api.delete(`/api/tasks/${id}/results`);
              fetchTask();
          } catch (error) {
              console.error('Failed to clear results', error);
              alert('Failed to clear results');
          }
      }
  }
  
  const handleDeleteResult = async (resultId: string) => {
      if (confirm('Delete this result item?')) {
          try {
              await api.delete(`/api/tasks/${id}/results/${resultId}`);
              // Optimistic update or refetch
              fetchTask();
          } catch (error) {
              console.error('Failed to delete result', error);
              alert('Failed to delete result');
          }
      }
  }
  
  const handleExport = async (format: 'md' | 'excel' | 'pdf') => {
      try {
          // Trigger download directly via browser
          // We need to use fetch/blob logic or just window.open if it's a GET with attachment header
          // But since we are using JWT, we need to pass token.
          // Let's use api client to get blob.
          const response = await api.get(`/api/tasks/${id}/export`, {
              params: { format },
              responseType: 'blob'
          });
          
          const extension = format === 'excel' ? 'xlsx' : format;
          const mimeType = format === 'excel' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : format === 'pdf' ? 'application/pdf' : 'text/markdown';

          const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `task-${id}-export.${extension}`);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          
          setIsExportMenuOpen(false);
      } catch (error) {
          console.error('Failed to export results', error);
          alert('Failed to export results');
      }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500">Task not found</p>
        <Link href="/">
          <Button variant="outline">Go back home</Button>
        </Link>
      </div>
    );
  }

  // Filter latest vs history results
  const latestResults = task.results?.filter((r: any) => 
      true
  ).slice(0, task.urls?.length || 1) || []; 

  const historyResults = task.results?.slice(latestResults.length) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
             </Link>
             {isEditing ? (
                 <Input 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="font-bold text-xl h-auto py-1"
                 />
             ) : (
                 <h1 className="text-3xl font-bold text-gray-900 truncate max-w-md">{task.name}</h1>
             )}
          </div>
          <div className="flex gap-3 flex-wrap">
             {isEditing ? (
                 <>
                    <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                    </Button>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                 </>
             ) : (
                 <>
                    {!['running', 'paused'].includes(task.status) && (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    )}
                    
                    {task.status === 'running' ? (
                         <Button onClick={handlePause} variant="secondary">
                            <PauseCircle className="h-4 w-4 mr-2" />
                            Pause
                         </Button>
                     ) : (
                         <Button onClick={handleExecute} disabled={task.status === 'completed'}>
                            <Play className="h-4 w-4 mr-2" />
                            {task.status === 'paused' ? 'Resume Task' : task.status === 'completed' ? 'Completed' : 'Run Task'}
                         </Button>
                     )}
                     
                     {(task.status === 'completed' || task.status === 'failed' || task.status === 'paused') && (
                         <Button variant="secondary" onClick={handleRestart}>
                             <RotateCcw className="h-4 w-4 mr-2" />
                             Restart
                         </Button>
                     )}
                     
                     <div className="relative">
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
                            disabled={!task.results || task.results.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                            <ChevronDown className="h-3 w-3 ml-2 opacity-70" />
                        </Button>
                        
                        {isExportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-200">
                                <button 
                                    onClick={() => handleExport('md')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                    Markdown (.md)
                                </button>
                                <button 
                                    onClick={() => handleExport('excel')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                    Excel (.xlsx)
                                </button>
                                <button 
                                    onClick={() => handleExport('pdf')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                >
                                    PDF (.pdf)
                                </button>
                            </div>
                        )}
                     </div>
                     
                     <Button variant="danger" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                     </Button>
                 </>
             )}
          </div>
        </div>

        {/* Progress Bar for Running Tasks */}
        {(task.status === 'running' || task.status === 'paused') && (
            <Card className={`border-blue-200 ${task.status === 'paused' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50'}`}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-medium flex items-center gap-2 ${task.status === 'paused' ? 'text-yellow-700' : 'text-blue-700'}`}>
                            {task.status === 'running' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <PauseCircle className="h-4 w-4" />
                            )}
                            {task.status === 'paused' ? 'Task Paused' : (task.current_step || 'Processing...')}
                        </span>
                        <span className={`text-sm font-bold ${task.status === 'paused' ? 'text-yellow-700' : 'text-blue-700'}`}>{task.progress || 0}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2.5 ${task.status === 'paused' ? 'bg-yellow-200' : 'bg-blue-200'}`}>
                        <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${task.status === 'paused' ? 'bg-yellow-600' : 'bg-blue-600'}`}
                            style={{ width: `${task.progress || 0}%` }}
                        ></div>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard 
            icon={getStatusIcon(task.status)} 
            label="Status" 
            value={task.status} 
            color={getStatusColor(task.status)} 
          />
          <StatusCard 
            icon={<Calendar className="h-5 w-5" />} 
            label="Created" 
            value={new Date(task.createdAt).toLocaleDateString()} 
          />
          <StatusCard 
            icon={<Clock className="h-5 w-5" />} 
            label="Last Executed" 
            value={task.executedAt ? new Date(task.executedAt).toLocaleString() : 'Never'} 
          />
           <StatusCard 
            icon={<Globe className="h-5 w-5" />} 
            label="Target URLs" 
            value={task.urls?.length || 0} 
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                    <textarea 
                        className="w-full h-32 p-2 border rounded-md font-mono text-sm bg-white"
                        value={editForm.instructions}
                        onChange={(e) => setEditForm({...editForm, instructions: e.target.value})}
                    />
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {task.instructions}
                    </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader 
                    className="flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg" 
                    onClick={() => setIsUrlsCollapsed(!isUrlsCollapsed)}
                >
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="h-5 w-5 text-gray-500" />
                        Target URLs
                    </CardTitle>
                    {isUrlsCollapsed ? <ChevronRight className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </CardHeader>
                {!isUrlsCollapsed && (
                <CardContent>
                    {isEditing ? (
                        <textarea 
                            className="w-full h-32 p-2 border rounded-md font-mono text-sm bg-white"
                            value={editForm.urls}
                            onChange={(e) => setEditForm({...editForm, urls: e.target.value})}
                            placeholder="Enter URLs, one per line"
                        />
                    ) : (
                        <ul className="space-y-2">
                            {task.urls?.map((url, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate">
                                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                                </li>
                            ))}
                             {!task.urls?.length && <li className="text-gray-500 text-sm">No URLs specified</li>}
                        </ul>
                    )}
                </CardContent>
                )}
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                   <Settings className="h-5 w-5 text-gray-500" />
                   Latest Results
                </CardTitle>
                {(task.results && task.results.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={handleClearResults} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear History
                    </Button>
                )}
              </CardHeader>
              <CardContent>
                {latestResults.length > 0 ? (
                  <div className="space-y-4">
                    {latestResults.map((result: any, index: number) => (
                      <ResultItem 
                        key={result.id || index} 
                        result={result} 
                        onDelete={() => handleDeleteResult(result.id)} 
                        onClick={() => setSelectedResult(result)}
                      />
                    ))}
                    
                    {historyResults.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                            <button 
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center text-sm text-gray-500 hover:text-gray-900 w-full justify-between"
                            >
                                <span>History ({historyResults.length} older items)</span>
                                {showHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            
                            {showHistory && (
                                <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                                    {historyResults.map((result: any, index: number) => (
                                        <ResultItem 
                                            key={result.id || `hist-${index}`} 
                                            result={result} 
                                            isHistory 
                                            onDelete={() => handleDeleteResult(result.id)} 
                                            onClick={() => setSelectedResult(result)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    {task.status === 'running' ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            <p>Waiting for results...</p>
                        </div>
                    ) : (
                        <p>No results yet. Run the task to generate data.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Metadata/Config */}
          <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Hash className="h-5 w-5 text-gray-500" />
                        Keywords
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {task.keywords ? task.keywords.split(',').map((k, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm">
                                {k.trim()}
                            </span>
                        )) : <span className="text-gray-500 text-sm">No keywords</span>}
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Drawer Component */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedResult(null)}
            ></div>
            
            {/* Drawer Panel */}
            <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 truncate pr-4">
                        {selectedResult.data?.title || 'Result Details'}
                    </h2>
                    <button 
                        onClick={() => setSelectedResult(null)}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Source Info */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Globe className="h-4 w-4" />
                            <span className="font-medium">Source URL:</span>
                        </div>
                        <a 
                            href={selectedResult.data?.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:underline break-all text-sm block"
                        >
                            {selectedResult.data?.url}
                        </a>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                            <Clock className="h-4 w-4" />
                            <span>Crawled at: {new Date(selectedResult.createdAt).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedResult.data?.summary && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-500" />
                                Summary
                            </h3>
                            <div className="bg-blue-50 p-4 rounded-lg text-gray-800 leading-relaxed text-sm">
                                {selectedResult.data.summary}
                            </div>
                        </div>
                    )}

                    {/* Extracted Data Fields */}
                    {(() => {
                        const { url, title, summary, type, items, timestamp, items_found, ...otherData } = selectedResult.data || {};
                        const hasOtherData = Object.keys(otherData).length > 0;
                        
                        if (!hasOtherData) return null;
                        
                        return (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Extracted Data</h3>
                                <div className="space-y-4">
                                    {Object.entries(otherData).map(([key, value]) => (
                                        <div key={key} className="border rounded-lg p-4">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">{key.replace(/_/g, ' ')}</span>
                                            <div className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                                                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* List Items */}
                    {selectedResult.data?.type === 'list_crawl' && selectedResult.data?.items && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{selectedResult.data.items.length}</span>
                                Extracted Items
                            </h3>
                            <div className="space-y-4">
                                {selectedResult.data.items.map((item: any, idx: number) => (
                                    <div key={idx} className="border border-blue-100 rounded-lg p-4 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-mono text-blue-500">#{idx + 1}</span>
                                            <a href={item.url} target="_blank" className="text-xs text-gray-400 hover:text-blue-600">
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <h4 className="font-medium text-blue-900 mb-2">{item.title || 'Untitled Item'}</h4>
                                        
                                        {item.content && (
                                            <div className="text-sm text-gray-600 mb-3 line-clamp-4">
                                                {item.content}
                                            </div>
                                        )}
                                        
                                        <div className="grid gap-2">
                                            {Object.entries(item).map(([k, v]) => {
                                                if (['url', 'title', 'content', 'timestamp'].includes(k)) return null;
                                                return (
                                                    <div key={k} className="text-xs bg-white p-2 rounded border border-blue-100">
                                                        <span className="font-semibold text-gray-600 mr-2">{k}:</span>
                                                        <span className="text-gray-800">{String(v)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* JSON View */}
                    <div className="pt-4 border-t">
                        <details>
                            <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-900 flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                View Raw JSON
                            </summary>
                            <pre className="mt-3 bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto font-mono text-xs">
                                {JSON.stringify(selectedResult.data, null, 2)}
                            </pre>
                        </details>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function ResultItem({ result, isHistory, onDelete, onClick }: { result: any, isHistory?: boolean, onDelete: () => void, onClick: () => void }) {
    // Filter out metadata fields for display
    const { url, title, summary, type, items, timestamp, items_found, ...otherData } = result.data || {};
    const hasOtherData = Object.keys(otherData).length > 0;

    return (
        <div 
            onClick={onClick}
            className={`border rounded-lg p-4 bg-white shadow-sm group relative cursor-pointer hover:shadow-md transition-shadow ${isHistory ? 'opacity-75 bg-gray-50' : ''}`}
        >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                    title="Delete result"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
            
            <div className="flex justify-between items-start mb-3 pr-6">
                <div>
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{title || 'Result Data'}</h4>
                    <a 
                        href={url} 
                        onClick={(e) => e.stopPropagation()} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                        {url} <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {new Date(result.createdAt).toLocaleTimeString()}
                </span>
            </div>
            
            {summary && (
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-3 border border-gray-100 line-clamp-3">
                    {summary}
                </div>
            )}

            {/* Dynamic JSON Data Display - Preview only */}
            {hasOtherData && (
                <div className="mb-3 grid gap-2">
                    {Object.entries(otherData).slice(0, 2).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{key.replace(/_/g, ' ')}</span>
                            <div className="text-sm text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                                {typeof value === 'string' ? value : JSON.stringify(value)}
                            </div>
                        </div>
                    ))}
                    {Object.keys(otherData).length > 2 && (
                        <p className="text-xs text-gray-400 text-center">+ {Object.keys(otherData).length - 2} more fields</p>
                    )}
                </div>
            )}

            {/* List Crawl Results Display - Preview */}
            {type === 'list_crawl' && items && (
                <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Extracted Items ({items_found || items.length}):</p>
                    <div className="space-y-2">
                        {items.slice(0, 2).map((item: any, idx: number) => (
                            <div key={idx} className="bg-blue-50 p-2 rounded text-sm border border-blue-100 truncate">
                                <span className="text-blue-700 font-medium">{item.title || item.url}</span>
                            </div>
                        ))}
                        {items.length > 2 && (
                             <p className="text-xs text-gray-400 text-center">+ {items.length - 2} more items</p>
                        )}
                    </div>
                </div>
            )}

            {result.errorMessage && (
                <div className="text-red-600 text-sm mb-2 bg-red-50 p-2 rounded border border-red-100">
                    Error: {result.errorMessage}
                </div>
            )}
            
            <div className="mt-2 text-center">
                 <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                     Click to view details
                 </span>
            </div>
        </div>
    )
}

function StatusCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color?: string }) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-full ${color ? 'bg-opacity-10 ' + color.replace('text-', 'bg-') : 'bg-gray-100 text-gray-600'}`}>
                   <div className={color}>{icon}</div>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="text-lg font-bold text-gray-900 capitalize">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function getStatusIcon(status: string) {
    switch(status) {
        case 'completed': return <CheckCircle className="h-5 w-5" />;
        case 'failed': return <AlertCircle className="h-5 w-5" />;
        case 'running': return <Loader2 className="h-5 w-5 animate-spin" />;
        case 'paused': return <PauseCircle className="h-5 w-5" />;
        default: return <Clock className="h-5 w-5" />;
    }
}

function getStatusColor(status: string) {
    switch(status) {
        case 'completed': return 'text-green-600';
        case 'failed': return 'text-red-600';
        case 'running': return 'text-blue-600';
        case 'paused': return 'text-yellow-600';
        default: return 'text-yellow-600';
    }
}

function ExternalLink({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}
