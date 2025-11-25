"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Loader2Icon, UserPlus, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/actions/user.action";

interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

function FollowButton({ userId, isFollowing: initialIsFollowing = false, onFollowChange }: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const router = useRouter();

  const handleFollow = async () => {
    // Optimistic update
    const previousState = isFollowing;
    setIsFollowing(!isFollowing);
    onFollowChange?.(!isFollowing);
    setIsLoading(true);

    try {
      const result = await toggleFollow(userId);
      if (!result.success) throw new Error(result.error);
      
      // Refresh the page to update server components
      router.refresh();
    } catch (error) {
      // Revert on error
      setIsFollowing(previousState);
      onFollowChange?.(previousState);
      toast.error(error instanceof Error ? error.message : "Error updating follow status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollow}
      disabled={isLoading}
      className="w-28 gap-1"
    >
      {isLoading ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <>
          {isFollowing ? (
            <>
              <UserCheck className="mr-1 size-4" /> Unfollow
            </>
          ) : (
            <>
              <UserPlus className="mr-1 size-4" /> Follow
            </>
          )}
        </>
      )}
    </Button>
  );
}

export default FollowButton;
