"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Square,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Code,
  Download,
  Copy,
  Check,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";
import { Task, TaskResult } from "@/types";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isUrlsCollapsed, setIsUrlsCollapsed] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TaskResult | null>(null);
  const [copiedInstruction, setCopiedInstruction] = useState(false);
  const [copiedStructuringInstruction, setCopiedStructuringInstruction] =
    useState(false);
  const [copiedUrls, setCopiedUrls] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"list" | "table">("list");

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    instructions: "",
    urls: "",
    structuringInstructions: "",
  });

  useEffect(() => {
    fetchTask();

    // Poll for updates if task is running
    const interval = setInterval(() => {
      if (task?.status === "running") {
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
          urls: response.data.urls.join("\n"),
          structuringInstructions: response.data.structuringInstructions || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch task", error);
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
      console.error("Failed to execute task", error);
      alert("Failed to execute task");
    }
  };

  const handleRestart = async () => {
    if (
      confirm(
        "This will clear current progress and restart the task. Continue?",
      )
    ) {
      try {
        await api.post(`/api/tasks/${id}/restart`);
        fetchTask();
      } catch (error) {
        console.error("Failed to restart task", error);
        alert("Failed to restart task");
      }
    }
  };

  const handlePause = async () => {
    try {
      await api.post(`/api/tasks/${id}/pause`);
      fetchTask(); // Refresh status
    } catch (error) {
      console.error("Failed to pause task", error);
      alert("Failed to pause task");
    }
  };

  const handleStop = async () => {
    if (
      confirm(
        "Are you sure you want to stop this task? It will be marked as failed.",
      )
    ) {
      try {
        await api.post(`/api/tasks/${id}/stop`);
        fetchTask(); // Refresh status
      } catch (error) {
        console.error("Failed to stop task", error);
        alert("Failed to stop task");
      }
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await api.delete(`/api/tasks/${id}`);
        router.push("/");
      } catch (error) {
        console.error("Failed to delete task", error);
        alert("Failed to delete task");
      }
    }
  };

  const handleSaveEdit = async () => {
    try {
      const urls = editForm.urls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
      await api.patch(`/api/tasks/${id}`, {
        name: editForm.name,
        instructions: editForm.instructions,
        urls: urls,
        structuringInstructions: editForm.structuringInstructions,
      });
      setIsEditing(false);
      fetchTask();
    } catch (error) {
      console.error("Failed to update task", error);
      alert("Failed to update task");
    }
  };

  const handleClearResults = async () => {
    if (confirm("Are you sure you want to clear ALL results history?")) {
      try {
        await api.delete(`/api/tasks/${id}/results`);
        fetchTask();
      } catch (error) {
        console.error("Failed to clear results", error);
        alert("Failed to clear results");
      }
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (confirm("Delete this result item?")) {
      try {
        await api.delete(`/api/tasks/${id}/results/${resultId}`);
        // Optimistic update or refetch
        fetchTask();
      } catch (error) {
        console.error("Failed to delete result", error);
        alert("Failed to delete result");
      }
    }
  };

  const handleExport = async (format: "md" | "excel" | "pdf") => {
    try {
      // Trigger download directly via browser
      // We need to use fetch/blob logic or just window.open if it's a GET with attachment header
      // But since we are using JWT, we need to pass token.
      // Let's use api client to get blob.
      const response = await api.get(`/api/tasks/${id}/export`, {
        params: { format },
        responseType: "blob",
      });

      const extension = format === "excel" ? "xlsx" : format;
      const mimeType =
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : format === "pdf"
            ? "application/pdf"
            : "text/markdown";

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: mimeType }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `task-${id}-export.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      setIsExportMenuOpen(false);
    } catch (error) {
      console.error("Failed to export results", error);
      alert("Failed to export results");
    }
  };

  const handleStructure = async () => {
    let instructions = task?.structuringInstructions;

    if (!instructions) {
      const userInput = window.prompt(
        "Please enter data structuring instructions (e.g., 'Extract title and price'):",
      );
      if (userInput === null) return; // User cancelled
      if (!userInput.trim()) {
        alert("Instructions are required.");
        return;
      }
      instructions = userInput;
    }

    try {
      await api.post(`/api/tasks/${id}/structure`, {
        structuringInstructions: instructions,
      });
      fetchTask();
    } catch (error) {
      console.error("Failed to structure data", error);
      alert("Failed to structure data");
    }
  };

  const handleCopy = (
    text: string,
    type: "instruction" | "urls" | "structuringInstruction",
  ) => {
    navigator.clipboard.writeText(text);
    if (type === "instruction") {
      setCopiedInstruction(true);
      setTimeout(() => setCopiedInstruction(false), 2000);
    } else if (type === "structuringInstruction") {
      setCopiedStructuringInstruction(true);
      setTimeout(() => setCopiedStructuringInstruction(false), 2000);
    } else {
      setCopiedUrls(true);
      setTimeout(() => setCopiedUrls(false), 2000);
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

  // Filter latest vs history results
  const latestResults = task.results?.slice(0, task.urls?.length || 1) || [];

  const historyResults = task.results?.slice(latestResults.length) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 w-full">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {isEditing ? (
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="font-bold text-xl h-auto py-1"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900 truncate max-w-full">
                {task.name}
              </h1>
            )}
          </div>
          <div className="flex gap-3 flex-wrap justify-end w-full">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSaveEdit}
                  className="bg-green-600 hover:bg-green-700"
                >
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
                {!["running", "paused"].includes(task.status) && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}

                {task.status === "running" ? (
                  <>
                    <Button onClick={handlePause} variant="secondary">
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button onClick={handleStop} variant="danger">
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleExecute}
                    disabled={task.status === "completed"}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {task.status === "paused"
                      ? "Resume Task"
                      : task.status === "completed"
                        ? "Completed"
                        : "Run Task"}
                  </Button>
                )}

                {task.status === "completed" &&
                  task.results &&
                  task.results.length > 0 && (
                    <Button variant="secondary" onClick={handleStructure}>
                      <Settings className="h-4 w-4 mr-2" />
                      Structure Data
                    </Button>
                  )}

                {(task.status === "completed" ||
                  task.status === "failed" ||
                  task.status === "paused") && (
                  <Button variant="secondary" onClick={handleRestart}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart
                  </Button>
                )}

                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar for Running Tasks */}
        {(task.status === "running" || task.status === "paused") && (
          <Card
            className={`border-blue-200 ${task.status === "paused" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50"}`}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-sm font-medium flex items-center gap-2 ${task.status === "paused" ? "text-yellow-700" : "text-blue-700"}`}
                >
                  {task.status === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PauseCircle className="h-4 w-4" />
                  )}
                  {task.status === "paused"
                    ? "Task Paused"
                    : task.current_step || "Processing..."}
                </span>
                <span
                  className={`text-sm font-bold ${task.status === "paused" ? "text-yellow-700" : "text-blue-700"}`}
                >
                  {task.progress || 0}%
                </span>
              </div>
              <div
                className={`w-full rounded-full h-2.5 ${task.status === "paused" ? "bg-yellow-200" : "bg-blue-200"}`}
              >
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ease-out ${task.status === "paused" ? "bg-yellow-600" : "bg-blue-600"}`}
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
            value={
              task.executedAt
                ? new Date(task.executedAt).toLocaleString()
                : "Never"
            }
          />
          <StatusCard
            icon={<Globe className="h-5 w-5" />}
            label="Target URLs"
            value={task.urls?.length || 0}
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-6">
          {/* Metadata/Config - Keywords moved above Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hash className="h-5 w-5 text-gray-500" />
                Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {task.keywords ? (
                  task.keywords.split(",").map((k, i) => (
                    <span
                      key={i}
                      className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm"
                    >
                      {k.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No keywords</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Crawling Instructions Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  Crawling Instructions
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(task.instructions, "instruction")}
                    className="text-gray-500 hover:text-gray-900"
                    title="Copy Instructions"
                  >
                    {copiedInstruction ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <textarea
                        className="w-full h-32 p-2 border rounded-md font-mono text-sm bg-white"
                        value={editForm.instructions}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            instructions: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {task.instructions}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Structuring Instructions Card */}
            {(isEditing || task.structuringInstructions) && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-gray-500" />
                    Data Structuring Instructions
                  </CardTitle>
                  {!isEditing && task.structuringInstructions && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(
                          task.structuringInstructions || "",
                          "structuringInstruction",
                        )
                      }
                      className="text-gray-500 hover:text-gray-900"
                      title="Copy Structuring Instructions"
                    >
                      {copiedStructuringInstruction ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div>
                      <textarea
                        className="w-full h-24 p-2 border rounded-md font-mono text-sm bg-white"
                        value={editForm.structuringInstructions}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            structuringInstructions: e.target.value,
                          })
                        }
                        placeholder="e.g. Extract fields: title, date, author..."
                      />
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900 border border-blue-100 whitespace-pre-wrap font-mono">
                      {task.structuringInstructions}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader
                className="flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                onClick={() => setIsUrlsCollapsed(!isUrlsCollapsed)}
              >
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-gray-500" />
                  Target URLs
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(task.urls?.join("\n") || "", "urls");
                      }}
                      className="text-gray-500 hover:text-gray-900"
                      title="Copy URLs"
                    >
                      {copiedUrls ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {isUrlsCollapsed ? (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              {!isUrlsCollapsed && (
                <CardContent>
                  {isEditing ? (
                    <textarea
                      className="w-full h-32 p-2 border rounded-md font-mono text-sm bg-white"
                      value={editForm.urls}
                      onChange={(e) =>
                        setEditForm({ ...editForm, urls: e.target.value })
                      }
                      placeholder="Enter URLs, one per line"
                    />
                  ) : (
                    <ul className="space-y-2">
                      {task.urls?.map((url, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                      {!task.urls?.length && (
                        <li className="text-gray-500 text-sm">
                          No URLs specified
                        </li>
                      )}
                    </ul>
                  )}
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-gray-500" />
                    Latest Results
                  </CardTitle>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab("list")}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === "list" ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setActiveTab("table")}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === "table" ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Table
                    </button>
                  </div>
                </div>

                {task.results && task.results.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearResults}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear History
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {latestResults.length > 0 ? (
                  activeTab === "list" ? (
                    <div className="space-y-4">
                      {latestResults.map(
                        (result: TaskResult, index: number) => (
                          <ResultItem
                            key={result.id || index}
                            result={result}
                            onDelete={() => handleDeleteResult(result.id)}
                            onClick={() => setSelectedResult(result)}
                          />
                        ),
                      )}

                      {historyResults.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center text-sm text-gray-500 hover:text-gray-900 w-full justify-between"
                          >
                            <span>
                              History ({historyResults.length} older items)
                            </span>
                            {showHistory ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>

                          {showHistory && (
                            <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                              {historyResults.map(
                                (result: TaskResult, index: number) => (
                                  <ResultItem
                                    key={result.id || `hist-${index}`}
                                    result={result}
                                    isHistory
                                    onDelete={() =>
                                      handleDeleteResult(result.id)
                                    }
                                    onClick={() => setSelectedResult(result)}
                                  />
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsTableModalOpen(true)}
                        >
                          <Maximize2 className="h-4 w-4 mr-2" />
                          Full Screen & Export
                        </Button>
                      </div>
                      <div className="max-h-[500px] overflow-auto border rounded-lg">
                        <ResultsTable results={latestResults} />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    {task.status === "running" ? (
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
        </div>
      </div>

      {/* Table View Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsTableModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Structured Data Table
              </h2>
              <div className="flex items-center gap-2">
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
                        onClick={() => handleExport("md")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      >
                        Markdown (.md)
                      </button>
                      <button
                        onClick={() => handleExport("excel")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      >
                        Excel (.xlsx)
                      </button>
                      <button
                        onClick={() => handleExport("pdf")}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      >
                        PDF (.pdf)
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsTableModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ResultsTable results={latestResults} />
            </div>
          </div>
        </div>
      )}

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
                {selectedResult.data?.title || "Result Details"}
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
                  href={selectedResult.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-sm block"
                >
                  {selectedResult.data.url}
                </a>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Crawled at:{" "}
                    {new Date(selectedResult.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Summary */}
              {selectedResult.data.summary && (
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

              {/* Structured Data */}
              {selectedResult.structuredData && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-600" />
                    Structured Data (AI)
                  </h3>
                  <div className="bg-purple-50 text-purple-900 rounded-lg overflow-x-auto border border-purple-100">
                    <ResultsTable results={[selectedResult]} />
                  </div>
                </div>
              )}

              {/* Extracted Data Fields */}
              {(() => {
                const {
                  url,
                  title,
                  summary,
                  type,
                  items,
                  timestamp,
                  items_found,
                  ...otherData
                } = selectedResult.data || {};
                const hasOtherData = Object.keys(otherData).length > 0;

                if (!hasOtherData) return null;

                return (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Extracted Data
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(otherData).map(([key, value]) => (
                        <div key={key} className="border rounded-lg p-4">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                            {key.replace(/_/g, " ")}
                          </span>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
                            {typeof value === "string"
                              ? value
                              : JSON.stringify(value, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* List Items */}
              {selectedResult.data.type === "list_crawl" &&
                selectedResult.data.items && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                        {selectedResult.data.items.length}
                      </span>
                      Extracted Items
                    </h3>
                    <div className="space-y-4">
                      {selectedResult.data.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="border border-blue-100 rounded-lg p-4 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-blue-500">
                              #{idx + 1}
                            </span>
                            <a
                              href={item.url}
                              target="_blank"
                              className="text-xs text-gray-400 hover:text-blue-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <h4 className="font-medium text-blue-900 mb-2">
                            {item.title || "Untitled Item"}
                          </h4>

                          {item.content && (
                            <div className="text-sm text-gray-600 mb-3 line-clamp-4">
                              {item.content}
                            </div>
                          )}

                          <div className="grid gap-2">
                            {Object.entries(item).map(([k, v]) => {
                              if (
                                [
                                  "url",
                                  "title",
                                  "content",
                                  "timestamp",
                                ].includes(k)
                              )
                                return null;
                              return (
                                <div
                                  key={k}
                                  className="text-xs bg-white p-2 rounded border border-blue-100"
                                >
                                  <span className="font-semibold text-gray-600 mr-2">
                                    {k}:
                                  </span>
                                  <span className="text-gray-800">
                                    {String(v)}
                                  </span>
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

function ResultsTable({ results }: { results: TaskResult[] }) {
  // Flatten data for the table
  const tableData = React.useMemo(() => {
    const flattened: Record<string, unknown>[] = [];
    results.forEach((r) => {
      const sourceData = (r.structuredData || r.data || {}) as
        | Record<string, unknown>
        | { items: Record<string, unknown>[] };
      const baseInfo = {
        _source_url: r.data?.url,
        _created_at: r.createdAt,
      };

      if (Array.isArray(sourceData)) {
        sourceData.forEach((item) => {
          flattened.push({ ...(item as Record<string, unknown>), ...baseInfo });
        });
      } else if ("items" in sourceData && Array.isArray(sourceData.items)) {
        sourceData.items.forEach((item: Record<string, unknown>) => {
          flattened.push({ ...item, ...baseInfo });
        });
      } else {
        flattened.push({
          ...(sourceData as Record<string, unknown>),
          ...baseInfo,
        });
      }
    });
    return flattened;
  }, [results]);

  if (tableData.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No data available for table view
      </div>
    );
  }

  // Collect all keys for columns
  const allKeys = Array.from(
    new Set(
      tableData.flatMap((item) =>
        Object.keys(item).filter(
          (k) =>
            ![
              "_source_url",
              "_created_at",
              "items",
              "type",
              "summary",
              "content",
            ].includes(k),
        ),
      ),
    ),
  );

  // Ensure we have some columns, if not, show raw keys
  const columns = allKeys.length > 0 ? allKeys : ["title", "url"];

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            {columns.map((key) => (
              <th
                key={key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                {key}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tableData.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {idx + 1}
              </td>
              {columns.map((key) => (
                <td
                  key={key}
                  className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
                  title={
                    typeof row[key] === "object"
                      ? JSON.stringify(row[key])
                      : String(row[key])
                  }
                >
                  {typeof row[key] === "object"
                    ? JSON.stringify(row[key])
                    : String(row[key] || "-")}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                <a
                  href={row._source_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  Link <ExternalLink className="h-3 w-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultItem({
  result,
  isHistory,
  onDelete,
  onClick,
}: {
  result: TaskResult;
  isHistory?: boolean;
  onDelete: () => void;
  onClick: () => void;
}) {
  // Filter out metadata fields for display
  const {
    url,
    title,
    summary,
    type,
    items,
    timestamp,
    items_found,
    ...otherData
  } = result.data || {};
  const hasOtherData = Object.keys(otherData).length > 0;

  // Format structured data preview
  const structuredPreview = result.structuredData
    ? Array.isArray(result.structuredData)
      ? result.structuredData
      : result.structuredData.items &&
          Array.isArray(result.structuredData.items)
        ? result.structuredData.items
        : result.structuredData
    : null;
  const isStructuredArray = Array.isArray(structuredPreview);

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-0 bg-white shadow-sm group relative cursor-pointer hover:shadow-md transition-shadow ${isHistory ? "opacity-75 bg-gray-50" : ""} overflow-hidden`}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Left Side: Original Scraped Data */}
        <div
          className={`p-4 ${result.structuredData ? "w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100" : "w-full"} min-w-0`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-full min-w-0">
              <div className="flex items-center gap-2 mb-1 justify-between">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-1 truncate">
                  {title || "Result Data"}
                </h4>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">
                  {new Date(result.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <a
                href={url}
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-2 truncate max-w-full"
              >
                <span className="truncate">{url}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          </div>

          {summary && (
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-3 border border-gray-100 line-clamp-3">
              {summary}
            </div>
          )}

          {!summary && hasOtherData && (
            <div className="text-xs text-gray-500 italic truncate">
              Raw data contains {Object.keys(otherData).length} extracted
              fields.
            </div>
          )}

          {/* List Crawl Results Display - Preview */}
          {type === "list_crawl" && items && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Extracted Items ({items_found || items.length}):
              </p>
              <div className="space-y-1">
                {items.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-blue-50 px-2 py-1 rounded text-xs border border-blue-100 truncate text-blue-700"
                  >
                    {item.title || item.url}
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-gray-400 text-center">
                    + {items.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: AI Structured Data */}
        {result.structuredData && (
          <div className="p-4 w-full md:w-1/2 bg-purple-50/30">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-purple-900 text-sm">
                AI Structured Data
              </h4>
            </div>

            <div className="space-y-2">
              {isStructuredArray ? (
                <div className="space-y-2">
                  {(structuredPreview as Record<string, unknown>[])
                    .slice(0, 3)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2 rounded border border-purple-100 text-xs shadow-sm"
                      >
                        {Object.entries(item)
                          .slice(0, 2)
                          .map(([k, v]) => (
                            <div
                              key={k}
                              className="flex gap-1 mb-0.5 w-full items-center"
                            >
                              <span
                                className="font-medium text-purple-800 whitespace-nowrap flex-shrink-0 max-w-[40%] truncate"
                                title={k}
                              >
                                {k}:
                              </span>
                              <span
                                className="text-gray-700 truncate flex-1 min-w-0"
                                title={String(v)}
                              >
                                {String(v)}
                              </span>
                            </div>
                          ))}
                      </div>
                    ))}
                  {(structuredPreview as Record<string, unknown>[]).length >
                    3 && (
                    <p className="text-xs text-purple-400 text-center">
                      +{" "}
                      {(structuredPreview as Record<string, unknown>[]).length -
                        3}{" "}
                      items
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white p-3 rounded border border-purple-100 text-xs shadow-sm space-y-1">
                  {Object.entries(structuredPreview as object)
                    .slice(0, 5)
                    .map(([k, v]) => (
                      <div
                        key={k}
                        className="grid grid-cols-3 gap-2 items-center w-full"
                      >
                        <span
                          className="font-medium text-purple-800 col-span-1 truncate"
                          title={k}
                        >
                          {k}:
                        </span>
                        <span
                          className="text-gray-700 col-span-2 truncate min-w-0"
                          title={String(v)}
                        >
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  {Object.keys(structuredPreview as object).length > 5 && (
                    <p className="text-center text-gray-400 pt-1">...</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 bg-white shadow-sm border"
          title="Delete result"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div
          className={`p-3 rounded-full ${color ? "bg-opacity-10 " + color.replace("text-", "bg-") : "bg-gray-100 text-gray-600"}`}
        >
          <div className={color}>{icon}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-lg font-bold text-gray-900 capitalize">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5" />;
    case "failed":
      return <AlertCircle className="h-5 w-5" />;
    case "running":
      return <Loader2 className="h-5 w-5 animate-spin" />;
    case "paused":
      return <PauseCircle className="h-5 w-5" />;
    default:
      return <Clock className="h-5 w-5" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "failed":
      return "text-red-600";
    case "running":
      return "text-blue-600";
    case "paused":
      return "text-yellow-600";
    default:
      return "text-yellow-600";
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
