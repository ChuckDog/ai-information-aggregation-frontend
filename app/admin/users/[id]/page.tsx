"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import TaskDashboard from "@/components/TaskDashboard";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h2 className="text-xl font-bold text-gray-800">User Task Dashboard</h2>
      </div>
      <TaskDashboard userId={userId} readOnly={true} />
    </div>
  );
}
