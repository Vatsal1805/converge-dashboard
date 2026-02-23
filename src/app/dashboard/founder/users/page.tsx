"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  User as UserIcon,
  Loader2,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "founder" | "teamlead" | "intern";
  department: string;
  status: "active" | "inactive";
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  // Form State
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "intern",
    department: "General",
  });

  // Edit Form State
  const [editUser, setEditUser] = useState<{
    _id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
    status: string;
  } | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users/list");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setCreateOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "intern",
        department: "General",
      });
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditUser({
      _id: user._id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setEditError("");
    setConfirmDelete(false);
    setEditOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!editUser) return;

    setDeleting(true);
    setEditError("");

    try {
      const res = await fetch(`/api/users/${editUser._id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove user");
      }

      setEditOpen(false);
      setEditUser(null);
      setConfirmDelete(false);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setSubmitting(true);
    setEditError("");

    try {
      const res = await fetch(`/api/users/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUser.name,
          email: editUser.email,
          password: editUser.password || undefined,
          role: editUser.role,
          department: editUser.department,
          status: editUser.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      setEditOpen(false);
      setEditUser(null);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage your team members and their roles.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="text-black hover:text-black">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new account for a team member.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teamlead">Team Lead</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={newUser.department}
                    onChange={(e) =>
                      setNewUser({ ...newUser, department: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="e.g. Marketing"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="text-black hover:text-black"
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow key="loading">
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow key="empty">
                  <TableCell colSpan={5} className="text-center py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "founder"
                            ? "default"
                            : user.role === "teamlead"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active" ? "outline" : "destructive"
                        }
                        className={
                          user.status === "active"
                            ? "text-green-600 border-green-200 bg-green-50"
                            : ""
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/team/${user._id}`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          className="text-black hover:text-black"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Leave password blank to keep current.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {editError && (
                <Alert variant="destructive">
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editUser?.name || ""}
                  onChange={(e) =>
                    setEditUser((prev) =>
                      prev ? { ...prev, name: e.target.value } : null,
                    )
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUser?.email || ""}
                  onChange={(e) =>
                    setEditUser((prev) =>
                      prev ? { ...prev, email: e.target.value } : null,
                    )
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">
                  Password
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editUser?.password || ""}
                  onChange={(e) =>
                    setEditUser((prev) =>
                      prev ? { ...prev, password: e.target.value } : null,
                    )
                  }
                  className="col-span-3"
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select
                  value={editUser?.role || "intern"}
                  onValueChange={(v) =>
                    setEditUser((prev) => (prev ? { ...prev, role: v } : null))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="teamlead">Team Lead</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-department" className="text-right">
                  Department
                </Label>
                <Input
                  id="edit-department"
                  value={editUser?.department || ""}
                  onChange={(e) =>
                    setEditUser((prev) =>
                      prev ? { ...prev, department: e.target.value } : null,
                    )
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <Select
                  value={editUser?.status || "active"}
                  onValueChange={(v) =>
                    setEditUser((prev) =>
                      prev ? { ...prev, status: v } : null,
                    )
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delete Section - only for non-founders */}
              {editUser && editUser.role !== "founder" && (
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        Danger Zone
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Remove this user from the company
                      </p>
                    </div>
                    {!confirmDelete ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDelete(true)}
                        className="text-black hover:text-black"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDelete(false)}
                          className="text-black hover:text-black"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteUser}
                          disabled={deleting}
                          className="text-black hover:text-black"
                        >
                          {deleting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Confirm Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="text-black hover:text-black"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="text-black hover:text-black"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
