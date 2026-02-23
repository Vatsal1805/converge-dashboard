"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  // Fetch notifications list
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/list?limit=10");
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

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    setOpen(false);
  };

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600";
      case "important":
        return "text-amber-600";
      default:
        return "text-blue-600";
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const seconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification._id}
                  className="p-4 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3 w-full">
                    <div className="flex-shrink-0 mt-0.5">
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                      {notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={`text-sm font-medium ${!notification.isRead ? "text-slate-900" : "text-slate-600"}`}
                        >
                          {notification.title}
                        </h4>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(notification.priority)}`}
                        >
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  router.push("/notifications");
                  setOpen(false);
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
