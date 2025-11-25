// IMPORTS
"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";
// END - IMPORTS

// GET PROFILE BY USERNAME 
export async function getProfileByUsername(username: string) {
  try {

    // FIND USER FIELD BY USERNAME
    const user = await prisma.user.findUnique({
      where: { username: username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw new Error("Failed to fetch profile");
  }
}

// GET USER POSTS
export async function getUserPosts(userId: string) {
  try {
    // WE FIND MANY WHERE AUTHOR ID IS USER ID AND RETURN FIELD
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return posts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw new Error("Failed to fetch user posts");
  }
}

// WE GET USER LIKED POSTS
export async function getUserLikedPosts(userId: string) {
  try {
    // WE FIND MANY WHERE LIKE ARE USER ID
    const likedPosts = await prisma.post.findMany({
      where: {
        likes: {
          some: {
            userId,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return likedPosts;
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    throw new Error("Failed to fetch liked posts");
  }
}

// WE CAN PASS FORM DATA AND UPDATE PROFILE
export async function updateProfile(formData: FormData) {
  try {
    // TAKE USERID FROM AUTH()
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    // DESTRUCTURE
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;

    // WE UPDATE USER DOCUMENT
    const user = await prisma.user.update({
      where: { clerkId },
      data: {
        name,
        bio,
        location,
        website,
      },
    });

    // REVALIDATE PATH
    revalidatePath("/profile");
    return { success: true, user };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// ISFOLLOWING WE PASS USER ID AND FOLLOW
export async function isFollowing(userId: string) {
  try {
    // WE GET USER ID
    const currentUserId = await getDbUserId();
    if (!currentUserId) return false;


    // `PRISMA.FOLLOWS` REFERS TO THE FOLLOWS MODEL IN OUR PRISMA SCHEMA
    // PRISMA GENERATES THIS AUTOMATICALLY FROM THE `model Follows { ... }` DEFINITION

    // THIS QUERY RETURNS EITHER:
    // 1) A `FOLLOWS` OBJECT → IF A FOLLOW RELATION EXISTS
    // 2) `NULL` → IF NO FOLLOW RECORD IS FOUND
    // SO THE TYPE HERE IS:  FOLLOWS | NULL

    // WE ARE CHECKING IF THE CURRENT USER IS ALREADY FOLLOWING THE TARGET USER
    // THE FOLLOWS TABLE USES A COMPOSITE PRIMARY KEY: (FOLLOWERID + FOLLOWINGID)
    // THAT MEANS BOTH IDS TOGETHER UNIQUELY IDENTIFY ONE FOLLOW RELATIONSHIP
    // THEREFORE WE MUST QUERY USING BOTH IDS EXACTLY

    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    // WE CONVERT THE FOLLOW VALUE INTO A STRICT BOOLEAN
    // IF `follow` IS AN OBJECT → USER IS ALREADY FOLLOWING → RETURNS TRUE
    // IF `follow` IS NULL → USER IS NOT FOLLOWING → RETURNS FALSE
    // `!!` IS JUST A QUICK WAY TO FORCE ANY VALUE INTO TRUE OR FALSE
    return !!follow;

  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}
