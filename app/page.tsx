"use client";

import React from "react";
import Header from "@/components/layout/Header";
import TaskDashboard from "@/components/TaskDashboard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TaskDashboard />
    </div>
  );
}
