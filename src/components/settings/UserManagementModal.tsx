import { useEffect, useRef, useState } from "react";
import {
  X,
  User,
  Shield,
  MoreVertical,
  UserPlus,
  Search,
  Trash2,
  Edit,
  Power,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase, User as ProfileUser } from "@/lib/supabase";
import { ToggleSwitch } from "./ToggleSwitch";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "sonner";

interface UserManagementModalProps {
  open: boolean;
  onClose: () => void;
}

type ExtendedProfile = ProfileUser & {
  email?: string;
  permissions?: {
    can_view_jobs: boolean;
    can_claim_jobs: boolean;
    can_create_groups: boolean;
    can_send_files: boolean;
    can_send_messages: boolean;
  };
};

export function UserManagementModal({ open, onClose }: UserManagementModalProps) {
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedProfile | null>(null);
  const [showEditPermissions, setShowEditPermissions] = useState(false);
  const [editPermissions, setEditPermissions] = useState({
    can_view_jobs: true,
    can_claim_jobs: true,
    can_create_groups: true,
    can_send_files: true,
    can_send_messages: true,
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProfileUser | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<ProfileUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    display_name: "",
    password: "",
    role: "member" as "admin" | "member",
    permissions: {
      can_view_jobs: true,
      can_claim_jobs: true,
      can_create_groups: true,
      can_send_files: true,
      can_send_messages: true,
    },
  });
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showEditPermissions) {
          setShowEditPermissions(false);
        } else if (showAddForm) {
          setShowAddForm(false);
        } else {
          onClose();
        }
      }
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, showAddForm, showEditPermissions, onClose]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.username || !newUser.display_name || !newUser.password) {
      toast.error("All fields are required");
      return;
    }
    if (newUser.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setNewUserLoading(true);
    try {
      const API_BASE = "https://Nexus-chat-app-nexus-chat.hf.space";
      const token = localStorage.getItem("nexus_access_token");

      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      toast.success("User created successfully");
      setShowAddForm(false);
      setNewUser({
        email: "",
        username: "",
        display_name: "",
        password: "",
        role: "member",
        permissions: {
          can_view_jobs: true,
          can_claim_jobs: true,
          can_create_groups: true,
          can_send_files: true,
          can_send_messages: true,
        },
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setNewUserLoading(false);
    }
  };

  const handleEditPermissions = (user: ExtendedProfile) => {
    setSelectedUser(user);
    setEditPermissions(
      user.permissions || {
        can_view_jobs: true,
        can_claim_jobs: true,
        can_create_groups: true,
        can_send_files: true,
        can_send_messages: true,
      }
    );
    setShowEditPermissions(true);
    setOpenMenuId(null);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    setActionLoading("permissions");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ permissions: editPermissions })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("Permissions updated");
      setShowEditPermissions(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update permissions");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (user: ProfileUser) => {
    setActionLoading(user.id);
    setOpenMenuId(null);
    setConfirmDeactivate(user);
  };

  const handleConfirmToggleActive = async () => {
    if (!confirmDeactivate) return;

    setActionLoading(confirmDeactivate.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !confirmDeactivate.is_active })
        .eq("id", confirmDeactivate.id);

      if (error) throw error;

      toast.success(confirmDeactivate.is_active ? "User deactivated" : "User activated");
      setConfirmDeactivate(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: ProfileUser) => {
    setActionLoading(user.id);
    setOpenMenuId(null);
    setConfirmDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    setActionLoading(confirmDelete.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", confirmDelete.id);

      if (error) throw error;

      toast.success("User deleted");
      setConfirmDelete(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            User Management
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-lg border border-border bg-input pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="ml-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {showAddForm && (
          <div className="border-b border-border bg-primary/5 p-4">
            <h3 className="mb-4 font-display text-sm font-semibold text-foreground">
              Create New User
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Username *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value.replace(/\s/g, "_").toLowerCase() })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newUser.display_name}
                  onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 pr-10 text-sm text-foreground focus:border-primary focus:outline-none"
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {passwordVisible ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "member" })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Permissions
              </label>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(newUser.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2">
                    <span className="text-xs text-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <ToggleSwitch
                      checked={value}
                      onChange={(v) =>
                        setNewUser({
                          ...newUser,
                          permissions: { ...newUser.permissions, [key]: v },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-lg px-4 py-2 font-display text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={newUserLoading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {newUserLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create User
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <User className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground">
                          {getInitials(user.display_name || user.username || "?")}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                          user.is_online ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {user.role}
                    </span>

                    <div className="relative" ref={openMenuId === user.id ? menuRef : null}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </button>

                      {openMenuId === user.id && (
                        <div className="absolute right-0 top-full mt-1 z-10 w-48 rounded-lg border border-border bg-card shadow-xl animate-scale-in">
                          <button
                            onClick={() => handleEditPermissions(user)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Permissions
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Power className="h-4 w-4" />
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showEditPermissions && selectedUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-scale-in">
              <h3 className="mb-4 font-display text-lg font-bold text-foreground">
                Edit Permissions: {selectedUser.display_name}
              </h3>
              <div className="space-y-3">
                {Object.entries(editPermissions).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3"
                  >
                    <span className="text-sm text-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <ToggleSwitch checked={value} onChange={(v) => setEditPermissions({ ...editPermissions, [key]: v })} />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowEditPermissions(false)}
                  className="rounded-lg px-4 py-2 font-display text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={actionLoading === "permissions"}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {actionLoading === "permissions" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!confirmDeactivate}
          onClose={() => setConfirmDeactivate(null)}
          onConfirm={handleConfirmToggleActive}
          title={confirmDeactivate?.is_active ? "Deactivate User" : "Activate User"}
          message={
            confirmDeactivate?.is_active
              ? `Are you sure you want to deactivate ${confirmDeactivate?.display_name || confirmDeactivate?.username}? They will not be able to log in.`
              : `Are you sure you want to activate ${confirmDeactivate?.display_name || confirmDeactivate?.username}?`
          }
          confirmText={confirmDeactivate?.is_active ? "Deactivate" : "Activate"}
          confirmColor={confirmDeactivate?.is_active ? "warning" : "primary"}
          loading={actionLoading === confirmDeactivate?.id}
        />

        <ConfirmDialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          message={
            <>
              <div className="flex items-center gap-2 mb-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">This action cannot be undone!</span>
              </div>
              <p>
                Are you sure you want to permanently delete{" "}
                <strong>{confirmDelete?.display_name || confirmDelete?.username}</strong>?
              </p>
            </>
          }
          confirmText="Delete"
          confirmColor="destructive"
          requireText="DELETE"
          loading={actionLoading === confirmDelete?.id}
        />
      </div>
    </div>
  );
}
