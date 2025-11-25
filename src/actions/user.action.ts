// IMPORTS
"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
// END - IMPORTS

// SYNC USER
export async function syncUser() {
  try {
    // WE GET USER ANF AWAIT THE CURRENT USER
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return; // IF USER EXIST THEN RETURN

    // EXISTINGUSER WE FIND USER
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    // IF EXISTING USER THEN RETURN EXISTING USER
    if (existingUser) return existingUser;

    // WE CREATE A USER AND RETURN
    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });

    // RETURN DBUSER
    return dbUser;
  } catch (error) {
    console.log("Error in syncUser", error);
  }
}

// USER BY CLIRK ID
export async function getUserByClerkId(clerkId: string) {
  // PRISMA USER FINDUNIQUE 
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

// WE GET USER DB USERID
export async function getDbUserId() {
  // USER FROM AUTH
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // GET USER BY CLIRK ID
  const user = await getUserByClerkId(clerkId);

  // IF NO USER THEN RETURN
  if (!user) throw new Error("User not found");

  return user.id;
}

// GET RANDOM USERS
export async function getRandomUsers() {
  try {
    // USERID FROM GETDBUSERID 
    const userId = await getDbUserId();
    if (!userId) return [];

    // RANDOMUSER WE JUST FIND USER THAT ARE NOT FOLLOWERS
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: 3,
    });

    return randomUsers;
  } catch (error) {
    console.log("Error fetching random users", error);
    return [];
  }
}

// TOGGLE FOLLOW WE PASS TARGET USER ID
export async function toggleFollow(targetUserId: string) {
  try {
    // WE GET USER 
    const userId = await getDbUserId();
    if (!userId) return;

    // IF WE TRY TO FOLLOW OURSELF WE CANT LIL BRO
    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    // IF EXISTING USER THEN UNFOLLOW
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    // IF EXISTING FOLLOW THEN WE DELETE THE RELATION
    if (existingFollow) {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // ELSE WE FOLLOW
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        // WE GET NOTIFICATION
        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user following
          },
        }),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}
