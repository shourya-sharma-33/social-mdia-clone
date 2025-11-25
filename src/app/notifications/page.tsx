"use client";

// IMPORT
import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action";
import { NotificationsSkeleton } from "@/components/NotificationSkeleton";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
// END - IMPORT

// NOTIFICATION TYPES
type Notifications = Awaited<ReturnType<typeof getNotifications>>;
type Notification = Notifications[number];

// GETTING NOTIFICATIONS 
const getNotificationIcon = (type: string) => {
  // SWITCH WE PASS TYPE AND GET ELEMENT
  switch (type) {
    case "LIKE":
      return <HeartIcon className="size-4 text-red-500" />;
    case "COMMENT":
      return <MessageCircleIcon className="size-4 text-blue-500" />;
    case "FOLLOW":
      return <UserPlusIcon className="size-4 text-green-500" />;
    default:
      return null;
  }
};

// THIS IS NOTIFICATION PAGE
function NotificationsPage() {
  // USE STATE FOR NOTIFICATION
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // EVERY LOADING THIS FUNCTION RUNS
  useEffect(() => {
    // WE FETCH NOTIFICATION
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);

        // UNREAD IDS ARE DATA WE FILTER WHERE N.READ IS FALSE AND WE MAP FOR GETTING THEIR IDS
        const unreadIds = data.filter((n) => !n.read).map((n) => n.id);
        // IF UNREAD IS HREATER THAN ZERO THAN WE AWAIT AND MARK ALL UNREAD AS READ
        if (unreadIds.length > 0) await markNotificationsAsRead(unreadIds);
      } catch (error) {
        toast.error("Failed to fetch notifications");
      } finally {
        setIsLoading(false);
      }
    };
    // FETCH NOTIFS
    fetchNotifications();
  }, []);
  // IF LOADING WE RENDER SKELETON
  if (isLoading) return <NotificationsSkeleton />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <span className="text-sm text-muted-foreground">
              {/* 
                  THIS SHOWS THE AMOUNT OF UNREAD NOTIFICATIONS
              */}
              {notifications.filter((n) => !n.read).length} unread
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {/* 
                IF NOTIF LENGTH ZERO THEN THIS OR MAP THE NOTIF
            */}
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications yet</div>
            ) : (
              // WE MAP NOTIFICATION 
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 border-b hover:bg-muted/25 transition-colors ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                >
                  <Avatar className="mt-1">
                    <AvatarImage src={notification.creator.image ?? "/avatar.png"} />
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {/* 
                          WE GET NOTIFICATION TYPE
                      */}
                      {getNotificationIcon(notification.type)}
                      <span>
                        <span className="font-medium">
                          {/* 
                              NOTIFICATION CREATOR NAME OR USERNAME
                          */}
                          {notification.creator.name ?? notification.creator.username}
                        </span>{" "}
                        {/* 
                            NOTIFICATION TYPE
                        */}
                        {notification.type === "FOLLOW"
                          ? "started following you"
                          : notification.type === "LIKE"
                          ? "liked your post"
                          : "commented on your post"}
                      </span>
                    </div>

                    {/* IF NOTIFICATION POST */}
                    {notification.post &&
                      (notification.type === "LIKE" || notification.type === "COMMENT") && (
                        <div className="pl-6 space-y-2">
                          <div className="text-sm text-muted-foreground rounded-md p-2 bg-muted/30 mt-2">
                            <p>{notification.post.content}</p>
                            {notification.post.image && (
                              <img
                                src={notification.post.image}
                                alt="Post content"
                                className="mt-2 rounded-md w-full max-w-[200px] h-auto object-cover"
                              />
                            )}
                          </div>
                            {/* IF COMMENT */}
                          {notification.type === "COMMENT" && notification.comment && (
                            <div className="text-sm p-2 bg-accent/50 rounded-md">
                              {notification.comment.content}
                            </div>
                          )}
                        </div>
                      )}

                      {/* DATE */}
                    <p className="text-sm text-muted-foreground pl-6">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
export default NotificationsPage;
