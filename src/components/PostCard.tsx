"use client";

import { createComment, deletePost, getPosts, toggleLike } from "@/actions/post.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { Button } from "./ui/button";
import { Heart, HeartIcon, Loader2Icon, LogInIcon, MessageCircle, MessageCircleIcon, Send, SendIcon } from "lucide-react";
import { Textarea } from "./ui/textarea";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.likes.some((like) => like.userId === dbUserId));
  const [optimisticLikes, setOptmisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);

  const router = useRouter();

  const handleLike = async () => {
    if (!dbUserId) return;
    
    // Optimistic update
    const previousLikes = optimisticLikes;
    const previousHasLiked = hasLiked;
    const newLikeCount = previousHasLiked ? previousLikes - 1 : previousLikes + 1;
    
    setHasLiked(!previousHasLiked);
    setOptmisticLikes(newLikeCount);
    
    try {
      const result = await toggleLike(post.id);
      if (!result?.success) throw new Error("Failed to update like");
      
      // Refresh to update server components
      router.refresh();
    } catch (error) {
      // Revert on error
      setHasLiked(previousHasLiked);
      setOptmisticLikes(previousLikes);
      toast.error(error instanceof Error ? error.message : "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    if (!user) return;
    
    const commentContent = newComment;
    // Optimistically update UI
    setNewComment("");
    setIsCommenting(true);
    
    try {
      const result = await createComment(post.id, commentContent);
      if (!result?.success) throw new Error("Failed to post comment");
      
      // Refresh to update comments list and count
      router.refresh();
      toast.success("Comment posted");
    } catch (error) {
      // Revert on error
      setNewComment(commentContent);
      toast.error("Failed to post comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);
      if (result.success) toast.success("Post deleted successfully");
      else throw new Error(result.error);
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex space-x-3 sm:space-x-4">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="size-8 sm:w-10 sm:h-10">
                <AvatarImage src={post.author.image ?? "/avatar.png"} />
              </Avatar>
            </Link>

            {/* POST HEADER & TEXT CONTENT */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="font-semibold truncate"
                  >
                    {post.author.name}
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Link href={`/profile/${post.author.username}`}>@{post.author.username}</Link>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                  </div>
                </div>
                {/* Check if current user is the post author */}
                {dbUserId === post.author.id && (
                  <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                )}
              </div>
              <p className="mt-2 text-sm text-foreground break-words">{post.content}</p>
            </div>
          </div>

          {/* POST IMAGE */}
          {post.image && (
            <div className="rounded-lg overflow-hidden">
              <img src={post.image} alt="Post content" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* LIKE & COMMENT BUTTONS */}
          <div className="flex items-center space-x-6 pt-3">
            <button
              onClick={handleLike}
              disabled={isLiking || !dbUserId}
              className={`flex items-center space-x-1.5 text-sm transition-colors ${
                hasLiked 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {hasLiked ? (
                <Heart className="size-5 fill-red-500 text-red-500" />
              ) : (
                <HeartIcon className="size-5" />
              )}
              <span className="font-medium">{optimisticLikes}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center space-x-1.5 text-sm transition-colors ${
                showComments 
                  ? "text-blue-500" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {showComments ? (
                <MessageCircle className="size-5 text-blue-500" />
              ) : (
                <MessageCircleIcon className="size-5" />
              )}
              <span className="font-medium">{post._count.comments}</span>
            </button>
          </div>

          {/* COMMENTS SECTION */}
          {showComments && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-4">
                {/* DISPLAY COMMENTS */}
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="size-8 flex-shrink-0">
                      <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-sm text-muted-foreground">
                          @{comment.author.username}
                        </span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-sm break-words">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {user ? (
                <div className="flex space-x-3">
                  <Avatar className="size-8 flex-shrink-0">
                    <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        disabled={!newComment.trim() || isCommenting || !user}
                        onClick={handleAddComment}
                      >
                        {isCommenting ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="gap-2">
                      <LogInIcon className="size-4" />
                      Sign in to comment
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
export default PostCard;
