"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

interface Notification {
  _id: string;
  type: string;
  priority: "critical" | "important" | "info";
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url =
        filter === "unread"
          ? "/api/notifications/list?limit=50&unreadOnly=true"
          : "/api/notifications/list?limit=50";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "important":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "task":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "project":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "lead":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "brainstorm":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "performance":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200";
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const seconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(notifDate);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "unread")}
      >
        <TabsList>
          <TabsTrigger value="all">
            All Notifications
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Bell className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  No notifications yet
                </h3>
                <p className="text-sm text-slate-500">
                  When you receive notifications, they'll appear here
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={`p-5 cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead
                      ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                      : "bg-white dark:bg-slate-900"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {!notification.isRead && (
                        <div className="h-3 w-3 rounded-full bg-blue-600" />
                      )}
                      {notification.isRead && (
                        <div className="h-3 w-3 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h3>
                        <span className="text-sm text-slate-500 whitespace-nowrap">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getPriorityColor(notification.priority)}
                        >
                          {notification.priority}
                        </Badge>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <CheckCheck className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  All caught up!
                </h3>
                <p className="text-sm text-slate-500">
                  You have no unread notifications
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification._id}
                  className="p-5 cursor-pointer transition-all hover:shadow-md bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-3 w-3 rounded-full bg-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {notification.title}
                        </h3>
                        <span className="text-sm text-slate-500 whitespace-nowrap">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getPriorityColor(notification.priority)}
                        >
                          {notification.priority}
                        </Badge>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark as read
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
