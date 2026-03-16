"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  X,
  Check,
  ChevronDown,
  User,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

export default function Header() {
  const { logout, user, setUser } = useAuthStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name || "",
      }));
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateSuccess(false);

    if (
      profileForm.password &&
      profileForm.password !== profileForm.confirmPassword
    ) {
      alert("Passwords do not match");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updateData: any = {};
      if (profileForm.name && profileForm.name !== user?.name) {
        updateData.name = profileForm.name;
      }
      if (profileForm.password) {
        updateData.password = profileForm.password;
      }

      if (Object.keys(updateData).length === 0) {
        setIsUpdatingProfile(false);
        return;
      }

      const response = await api.patch("/auth/profile", updateData);
      setUser(response.data);
      setUpdateSuccess(true);

      // Clear password fields
      setProfileForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));

      // Close modal after delay
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setUpdateSuccess(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold text-gray-900 hover:text-gray-700"
          >
            Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.name || user?.email}
            </span>

            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={openProfileModal}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </button>

                  {user?.role === "admin" && (
                    <Link
                      href="/admin/users"
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Platform Admin
                    </Link>
                  )}
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsProfileModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Profile Settings
              </h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Display Name
                </label>
                <Input
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  placeholder="Your Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  New Password (Optional)
                </label>
                <Input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, password: e.target.value })
                  }
                  placeholder="Leave empty to keep current"
                />
              </div>

              {profileForm.password && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className={
                    updateSuccess ? "bg-green-600 hover:bg-green-700" : ""
                  }
                >
                  {isUpdatingProfile ? (
                    "Saving..."
                  ) : updateSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
