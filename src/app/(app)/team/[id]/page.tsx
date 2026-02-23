"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Building2,
  Crown,
  Shield,
  User as UserIcon,
  Phone,
  Linkedin,
  Github,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: "founder" | "teamlead" | "intern";
  department: string;
  status: "active" | "inactive";
  phone?: string;
  linkedin?: string;
  github?: string;
  timezone?: string;
  profileCompleted?: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${params.id}`);
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          setError(data.error || "Failed to load user profile");
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [params.id]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "founder":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case "teamlead":
        return <Shield className="h-5 w-5 text-blue-500" />;
      default:
        return <UserIcon className="h-5 w-5 text-slate-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "founder":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "teamlead":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-pink-500",
    ];
    const index =
      name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/team")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Team
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Profile
            </h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/team")}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Team
      </Button>

      {/* Header Card with Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className={`h-24 w-24 ${getAvatarColor(user.name)}`}>
              <AvatarFallback className="text-white font-semibold text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                {getRoleIcon(user.role)}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={getRoleBadgeColor(user.role)}
                >
                  {user.role === "teamlead"
                    ? "Team Lead"
                    : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                <Badge
                  variant={user.status === "active" ? "default" : "secondary"}
                >
                  {user.status === "active" ? "Active" : "Inactive"}
                </Badge>
                {user.profileCompleted && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Profile Complete
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How to reach this team member</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <a
                  href={`mailto:${user.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {user.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Phone
                </p>
                <p className="text-foreground">
                  {user.phone || (
                    <span className="text-muted-foreground italic">
                      Not provided
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Linkedin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  LinkedIn
                </p>
                {user.linkedin ? (
                  <a
                    href={
                      user.linkedin.startsWith("http")
                        ? user.linkedin
                        : `https://${user.linkedin}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {user.linkedin}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not provided
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Github className="h-5 w-5 text-slate-700 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  GitHub
                </p>
                {user.github ? (
                  <a
                    href={
                      user.github.startsWith("http")
                        ? user.github
                        : `https://${user.github}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {user.github}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not provided
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card>
        <CardHeader>
          <CardTitle>Work Information</CardTitle>
          <CardDescription>
            Details about their role and department
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Department
                </p>
                <p className="text-foreground">{user.department}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Timezone
                </p>
                <p className="text-foreground">
                  {user.timezone || (
                    <span className="text-muted-foreground italic">
                      Not set
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Joined
                </p>
                <p className="text-foreground">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Login
                </p>
                <p className="text-foreground">{formatDate(user.lastLogin)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
