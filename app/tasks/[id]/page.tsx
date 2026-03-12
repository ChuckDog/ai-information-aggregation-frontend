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
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';
import { Task } from '@/types';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to fetch task', error);
      alert('Failed to fetch task details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    try {
      await api.post(`/tasks/${id}/execute`);
      alert('Task execution started');
      fetchTask(); // Refresh status
    } catch (error) {
      console.error('Failed to execute task', error);
      alert('Failed to execute task');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        router.push('/');
      } catch (error) {
        console.error('Failed to delete task', error);
        alert('Failed to delete task');
      }
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
             <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
             </Link>
             <h1 className="text-3xl font-bold text-gray-900">{task.name}</h1>
          </div>
          <div className="flex gap-3">
             <Button onClick={handleExecute} disabled={task.status === 'running'}>
                <Play className="h-4 w-4 mr-2" />
                {task.status === 'running' ? 'Running...' : 'Run Task'}
             </Button>
             <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
             </Button>
          </div>
        </div>

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
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {task.instructions}
                </div>
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="h-5 w-5 text-gray-500" />
                        Target URLs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {task.urls?.map((url, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate">
                                <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                            </li>
                        ))}
                         {!task.urls?.length && <li className="text-gray-500 text-sm">No URLs specified</li>}
                    </ul>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                   <Settings className="h-5 w-5 text-gray-500" />
                   Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {task.results && task.results.length > 0 ? (
                  <div className="space-y-4">
                    {task.results.map((result: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                           <span className={`text-xs font-bold px-2 py-1 rounded ${result.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {result.status}
                           </span>
                           <span className="text-xs text-gray-500">
                              {new Date(result.createdAt).toLocaleString()}
                           </span>
                        </div>
                        {result.errorMessage && (
                            <div className="text-red-600 text-sm mb-2">
                                Error: {result.errorMessage}
                            </div>
                        )}
                        <pre className="text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No results yet. Run the task to generate data.
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
    </div>
  );
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
        case 'running': return <Play className="h-5 w-5" />;
        default: return <Clock className="h-5 w-5" />;
    }
}

function getStatusColor(status: string) {
    switch(status) {
        case 'completed': return 'text-green-600';
        case 'failed': return 'text-red-600';
        case 'running': return 'text-blue-600';
        default: return 'text-yellow-600';
    }
}
