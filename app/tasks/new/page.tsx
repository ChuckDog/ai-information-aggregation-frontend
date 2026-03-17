"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { CreateTaskDto } from "@/types";

export default function NewTaskPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskDto>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: CreateTaskDto) => {
    setIsLoading(true);
    try {
      // Handle array inputs (urls) if they are entered as comma separated strings or lines
      // For simplicity, let's assume URLs are entered as comma-separated string in a text input for now,
      // or just one text area.
      // But CreateTaskDto expects string[].
      // Let's create a wrapper or just handle it here.

      const formattedData = {
        ...data,
        urls:
          typeof data.urls === "string"
            ? (data.urls as string).split("\n").filter((u) => u.trim())
            : [],
      };

      await api.post("/api/tasks", formattedData);
      router.push("/");
    } catch (error) {
      console.error("Failed to create task", error);
      alert("Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Task Name"
                placeholder="e.g., Competitor Analysis"
                {...register("name", { required: "Task name is required" })}
                error={errors.name?.message}
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Instructions
                </label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what you want to extract or analyze..."
                  {...register("instructions", {
                    required: "Instructions are required",
                  })}
                />
                {errors.instructions && (
                  <p className="text-sm text-red-500">
                    {errors.instructions.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Data Structuring Instructions (Optional)
                </label>
                <p className="text-xs text-gray-500">
                  Describe how you want the data formatted (e.g., &quot;Extract
                  a list of products with name, price, and description&quot;).
                  AI will transform the raw data based on this.
                </p>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. Extract fields: title, date, author, content summary..."
                  {...register("structuringInstructions")}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Target URLs (one per line)
                </label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                  {...register("urls")}
                />
              </div>

              <Input
                label="Keywords (optional)"
                placeholder="e.g., pricing, features"
                {...register("keywords")}
              />

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Scheduling (Optional)
                </h3>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isScheduled"
                    {...register("isScheduled")}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isScheduled"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Enable automatic scheduling
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Schedule Description
                  </label>
                  <p className="text-xs text-gray-500">
                    Describe when you want the task to run naturally.
                    <br />
                    e.g., "Every day at 9 AM", "Every Monday morning", "Once an
                    hour"
                  </p>
                  <Input
                    placeholder="e.g., Every day at 9 AM"
                    {...register("scheduleDescription")}
                  />
                  {/* Hidden cron input if we still want to support manual override or just use backend generation */}
                  {/* For now, let's rely on backend generation based on description */}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <Link href="/">
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" isLoading={isLoading}>
                  Create Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
