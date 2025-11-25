// POST ACTIONS
"use server";

// IMPORTS
import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
// END - IMPORTS

// TO CREATE A POST
export async function createPost(content: string, image: string) {
  try {
    // WE GET USER ID
    const userId = await getDbUserId();

    if (!userId) return;

    // WE CREATE A POST
    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });

    // WE RETURN SUCCRESS
    revalidatePath("/"); // purge the cache for the home page
    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post" };
  }
}

// TO GET POSTS
export async function getPosts() {
  try {
    // TO FIND POSTS AND RETURN
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
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
    });

    return posts;
  } catch (error) {
    console.log("Error in getPosts", error);
    throw new Error("Failed to fetch posts");
  }
}
// TO TOGGLE LIKE
export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) {
      throw new Error("You must be logged in to like a post");
    }

    // IF USER ID AND POST ID ARE LIKED ALREADY
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    // WE FIND POST
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    // IF NO POST THAN ERROR
    if (!post) throw new Error("Post not found");

    // IF EXISTING LIKE THEN WE DELETE
    if (existingLike) {
      // unlike
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      // LIKE POST AND SEND NOTIFICATION
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        // IF POST AUTHOR ISNT SAME AS USER ID THEN WE SEND NOTIF
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.authorId, // recipient (post author)
                  creatorId: userId, // person who liked
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/");
    revalidatePath(`/profile/[username]`, 'page');
    
    return {
      success: true, 
      message: existingLike ? "Unliked post" : "Liked post" 
    };
  } catch (error) {
    console.error("Error in toggleLike", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error toggling like" 
    };
  }
}

// TO CREATE COMMENT
export async function createComment(postId: string, content: string) {
  try {
    // STRING AND CONTENT AS PARAMETER
    // WE GET USER ID
    const userId = await getDbUserId();

    // IF NO USER ID
    if (!userId) return;
    //  IF NO CONTENT
    if (!content) throw new Error("Content is required");

    // WE FIND POST FROM POST ID
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    // IF NO POST THEN RETURN ERROR
    if (!post) throw new Error("Post not found");

    // THEN WE DESTRUCTURE AND SAVE THE COMMENT
    const [comment] = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      // THEN WE CREATE A NOTIFICATON
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      // THEN WE RETURN COMMENT
      return [newComment];
    });

    // REVALIDATE PATH FOR REFRESHING
    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

// TO DELETE A POST
export async function deletePost(postId: string) {
  try {
    // WE TAKE USER ID
    const userId = await getDbUserId();

    // WE FIND USER POST
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    // IF NO POST THEN ERROR
    if (!post) throw new Error("Post not found");
    // FIND AUTHOR ID ISNT USER ID THEN ERROR THOWN
    if (post.authorId !== userId) throw new Error("Unauthorized - no delete permission");

    // WE DELETE THE POST
    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/"); // REFRESH
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}
