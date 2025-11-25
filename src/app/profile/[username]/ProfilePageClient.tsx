"use client";

// IMPORTS
import { getProfileByUsername, getUserPosts, updateProfile } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FollowButton from "@/components/FollowButton";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
// END - IMPORTS

// THIS IS KINDA COMPLEX TYPE SCRIPT
// BUT WE TAKE TYPE OF GETPROFILEBYUSERNAME BUT SINCE THAT IS A FUNCTION
// WE TAKE THE RETURN TYPE, BUT SINCE THAT IS A PROMISE, WE TAKE WHAT WILL
// BE THE AWAITTED TYPE
type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;


// DEFINING PROPS
interface ProfilePageClientProps {
  user: NonNullable<User>;
  posts: Posts;
  likedPosts: Posts;
  isFollowing: boolean;
}

// MAKING OUR PROFILEPAGECLIENT
function ProfilePageClient({
  isFollowing: initialIsFollowing,
  likedPosts,
  posts,
  user,
}: ProfilePageClientProps) {
  // WE GET USER
  const { user: currentUser } = useUser();
  // WE SHOW EDIT DIALOG
  const [showEditDialog, setShowEditDialog] = useState(false);
  // FOLLOWING STATE
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  // USE ROUTER
  const router = useRouter();

  // USE STATE FOR FORM
  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });

  // FOR SUBMITTING THE EDIT
  const handleEditSubmit = async () => {
    // WILL WILL MAKE EMPTY
    const formData = new FormData();
    // WE WILL TAKE OBJECT ENTRIES OF FORM OBJECT AND APPEND THE FORMDATA
    Object.entries(editForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // WE WILL UPDATE PROFILE FROM ACTIONS
    const result = await updateProfile(formData);
    // AND SHOW SUCCESS
    if (result.success) {
      // AND SET SHOW EDIT DIAGLOG AS FALSE
      setShowEditDialog(false);
      // RENDER A TOAST
      toast.success("Profile updated successfully");
    }
  };

  // HANDLE FOLLOW CHANGE
  // NEW FOLLOWER STATE AS BOOLEAN
  // IF IS FOLLOWING THEN SET IS FOLLOWING AS THE PASSED FOLLOWING STATE
  // AND REFRESH THE ROUTER TO RENDER CHANGE
  const handleFollowChange = (newFollowState: boolean) => {
    setIsFollowing(newFollowState);
    router.refresh();
  };

  const isOwnProfile =
    // IF CURRENT USER, AS IN THE PARAMS ISNT THE CURRENT USER THAT IS LOGGED IN
    // WHICH WE KNOW FROM CLERK OR THE USER'S EMAIL WITH THE SAME LOGIC

    // THEN WE RETURN A BOOLEAN AND STORE IN IS OWN PROFILE
    currentUser?.username === user.username ||
    currentUser?.emailAddresses[0].emailAddress.split("@")[0] === user.username;

  // THIS IS A DATE FORMAT
  const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {/* 
                    RENDER AVATAR WITH IF USER IMAGE OR THE DEFAULT AVATAR PNG
                */}
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.image ?? "/avatar.png"} />
                </Avatar>
                <h1 className="mt-4 text-2xl font-bold">{user.name ?? user.username}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                <p className="mt-2 text-sm">{user.bio}</p>

                {/* 
                    WE THEN RENDER FOLLOWER AND FOLLOWING AND STUFF
                */}
                <div className="w-full mt-6">
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="font-semibold">{user._count.following.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                    <Separator orientation="vertical" />
                    <div>
                      <div className="font-semibold">{user._count.followers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <Separator orientation="vertical" />
                    <div>
                      <div className="font-semibold">{user._count.posts.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                  </div>
                </div>

                {/* 
                      "FOLLOW & EDIT PROFILE" BUTTONS 
                      IF THE USER ISNT CURRENT USER THEN RENDER FOLLOW BUTTON ELSE THE EDIT BUTTON
                */}
                {!currentUser ? (
                  <SignInButton mode="modal">
                    {/* 
                        THEN WE WILL BE PROMPTED TO SIGN IN TO FOLLOW LIKE IN ACTUAL APPS
                    */}
                    <Button className="w-full mt-4">Follow</Button>
                  </SignInButton>
                ) : isOwnProfile ? (
                  <Button className="w-full mt-4" onClick={() => setShowEditDialog(true)}>
                    {/*     
                        THEN WE GET TO EDIT OUR PROFILE
                    */}
                    <EditIcon className="size-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                    // IF WE HAVE AN ACCOUNT AND THE ACCOUNT WE ARE AT ISNT OURS THEN SIMPLY FOLLOW
                  <FollowButton 
                    userId={user.id} 
                    isFollowing={isFollowing}
                    onFollowChange={handleFollowChange}
                  />
                )}

                {/* 
                    LOCATION & WEBSITE 
                */}
                <div className="w-full mt-6 space-y-2 text-sm">
                  {/*
                      IF USER LOCATION IS THEN WE SHOW USER LOCATION 
                  */}
                  {user.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPinIcon className="size-4 mr-2" />
                      {user.location}
                    </div>
                  )}
                  {/* 
                      IF USER HAS AN WEBSITE THEN SHOW THE DIV
                  */}
                  {user.website && (
                    <div className="flex items-center text-muted-foreground">
                      <LinkIcon className="size-4 mr-2" />
                      <a
                        href={
                          user.website.startsWith("http") ? user.website : `https://${user.website}`
                        }
                        className="hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  {/* 
                      SHOW WHEN WE MADE THIS ACCOUNT OR WHEN WAS ACCOUNT MADE
                  */}
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="size-4 mr-2" />
                    Joined {formattedDate}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        

        {/* 
            import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
            GO VISIT THIS AND READ
        */}
        <Tabs defaultValue="posts" className="w-full">
          {/* 
              TABS WITH TAB LIST NESTED WITH TAB TRIGGER 
          */}
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
               data-[state=active]:bg-transparent px-6 font-semibold"
            >
              <FileTextIcon className="size-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
               data-[state=active]:bg-transparent px-6 font-semibold"
            >
              <HeartIcon className="size-4" />
              Likes
            </TabsTrigger>
          </TabsList>
            
            {/* 
                FOR TAB CONTENT VALUE POST, WE RENDER ALL POST IN POSTCARD
            */}

          <TabsContent value="posts" className="mt-6">
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} dbUserId={user.id} />)
              ) : (
                <div className="text-center py-8 text-muted-foreground">No posts yet</div>
              )}
            </div>
          </TabsContent>

              {/* 
                  THIS RENDERS LIKED POSTS
              */}
          <TabsContent value="likes" className="mt-6">
            <div className="space-y-6">
              {likedPosts.length > 0 ? (
                likedPosts.map((post) => <PostCard key={post.id} post={post} dbUserId={user.id} />)
              ) : (
                <div className="text-center py-8 text-muted-foreground">No liked posts to show</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* 
            THIS IS TO EDIT OUR USER
        */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  name="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  name="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Where are you based?"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  name="website"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="Your personal website"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              {/* 
                  THIS BUTTON SUBMIT
              */}
              <Button onClick={handleEditSubmit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
export default ProfilePageClient;
