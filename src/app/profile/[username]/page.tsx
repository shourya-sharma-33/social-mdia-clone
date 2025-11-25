// THIS IS IMPORTANT
// HOW TO HAVE DYNAMIC ROUTING
// BASICALLY WE CAN DO WHAT WE CAN USE [] SQUARE BRACKETS
// WE CAN USE SQUARE BRACKETS AND THEN IN PAGE FUNCTIONS
// AND PASS PARAMS AND THEN USE THE PARAMS TO HAVE DYNAMIC ROUTING

// SAY WE HIT URL
// LOCALHOST:3000/PROFILE/123456789
// THEN 123456789 WILL BE PASSED AS PARAMTER

// IMPORTS
import {
  getProfileByUsername,
  getUserLikedPosts,
  getUserPosts,
  isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";
// END - IMPORTS

// GENERATE METADATA
export async function generateMetadata({ params }: { params: { username: string } }) {
  // FIND PROFILE BY USER IF NO USER THEN RETURN
  // WE HAVE PASSED {PARAMS} : {PARAMS : {USERNAME : STRING}}
  const user = await getProfileByUsername(params.username);
  if (!user) return;

  // THEN WE RETURN TITLE AND DESCTRIPTION
  return {
    title: `${user.name ?? user.username}`,
    description: user.bio || `Check out ${user.username}'s profile.`,
  };
}
// END - GENERATE METADATA

// PROFILEPAGE SERVER
async function ProfilePageServer({ params }: { params: { username: string } }) {
  // WE GET USER BY ID
  const user = await getProfileByUsername(params.username);
  // IF NO USER THEN NOT FOUND
  if (!user) notFound();

  // THEN WE DESTRUCTURE RESULT OF PROMISES AND STORE IN THE SERVER SIDE FUNCTIONS
  const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
    getUserPosts(user.id),
    getUserLikedPosts(user.id),
    isFollowing(user.id),
  ]);

  // THEN PASS THIS IN THE PROFILEPAGECLIENT COMPONENT
  return (
    <ProfilePageClient
      user={user}
      posts={posts}
      likedPosts={likedPosts}
      isFollowing={isCurrentUserFollowing}
    />
  );
}
export default ProfilePageServer;
