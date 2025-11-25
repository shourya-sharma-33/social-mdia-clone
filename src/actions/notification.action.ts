// IMPORT
"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
// END - IMPORT

// GET NOTIFICATION
export async function getNotifications() {
  try {
    // IF WE GET USER
    const userId = await getDbUserId();
    if (!userId) return [];

    // NOTIFICATION
    // W JS CAWLIN DEM NOTIFICATIONS F SHWN N D ROUTE
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            image: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // RETURN NOTIFICATION
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

// MARKING NOTIFICATION AS RED
export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    // W UPDEYT DM NOTIFICATION SCHEMA
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        read: true,
      },
    });
  
    // RTRN SKCS
    return { success: true };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return { success: false };
  }
}
