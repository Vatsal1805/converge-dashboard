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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
// import { Calendar } from "@/components/ui/calendar" // Ensure calendar component exists or use native date input
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface User {
  _id: string;
  name: string;
  role: string;
  department?: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  teamLeadId: User;
  members: User[];
  department: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [interns, setInterns] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    description: "",
    teamLeadIds: [] as string[],
    members: [] as string[],
    priority: "medium",
    deadline: "",
    budget: 0,
  });

  useEffect(() => {
    // Fetch users to populate Team Lead select
    // Need an endpoint for list users. We have /api/users/list.
    // It returns all users. We filter for team leads.
    const fetchData = async () => {
      try {
        const [usersRes, userRes] = await Promise.all([
          fetch("/api/users/list"),
          fetch("/api/auth/me"),
        ]);
        const usersData = await usersRes.json();
        const userData = await userRes.json();

        if (userData.user && userData.user.role === "intern") {
          router.push("/dashboard/intern");
          return;
        }

        if (usersData.users) {
          const leads = usersData.users.filter(
            (u: any) => u.role === "teamlead",
          );
          const internsList = usersData.users.filter(
            (u: any) => u.role === "intern",
          );
          setTeamLeads(leads);
          setInterns(internsList);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.teamLeadIds.length === 0) {
      setError("Please select at least one team lead");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      router.push("/projects");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamLead = (leadId: string) => {
    setFormData((prev) => ({
      ...prev,
      teamLeadIds: prev.teamLeadIds.includes(leadId)
        ? prev.teamLeadIds.filter((id) => id !== leadId)
        : [...prev.teamLeadIds, leadId],
    }));
  };

  const toggleMember = (internId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(internId)
        ? prev.members.filter((id) => id !== internId)
        : [...prev.members, internId],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Create New Project
        </h2>
        <p className="text-muted-foreground">
          Define project details and assign a team lead.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Fill in the information below to start a new project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Website Redesign"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input
                  id="client"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  placeholder="e.g. Acme Corp"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the project scope..."
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Assign Team Leads (Select one or more)</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {teamLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No team leads available
                  </p>
                ) : (
                  teamLeads.map((lead) => (
                    <div key={lead._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lead-${lead._id}`}
                        checked={formData.teamLeadIds.includes(lead._id)}
                        onCheckedChange={() => toggleTeamLead(lead._id)}
                      />
                      <label
                        htmlFor={`lead-${lead._id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {lead.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {formData.teamLeadIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.teamLeadIds.length} team lead
                  {formData.teamLeadIds.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Assign Team Members (Interns - Optional)</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {interns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No interns available
                  </p>
                ) : (
                  interns.map((intern) => (
                    <div key={intern._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`intern-${intern._id}`}
                        checked={formData.members.includes(intern._id)}
                        onCheckedChange={() => toggleMember(intern._id)}
                      />
                      <label
                        htmlFor={`intern-${intern._id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {intern.name}
                        {intern.department && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({intern.department})
                          </span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {formData.members.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formData.members.length} intern
                  {formData.members.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData({ ...formData, priority: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: Number(e.target.value) })
                }
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="text-black hover:text-black"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="text-black hover:text-black"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
