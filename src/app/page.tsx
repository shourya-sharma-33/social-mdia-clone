// IMPORTS
import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import WhoToFollow from "@/components/WhoToFollow";
import { currentUser } from "@clerk/nextjs/server";
// END - IMPORTS

// NEXTJS HANDLES ALOT OF THE MINI SCHENANIGANS THAT U HAVE TO CONFIGURE FOR SIMPLE REACT
// LIKE THIS IS AN ASYNC COMPONENT THAT WILL AWAIT UNTIL ENTIRE APP PROCESSES
// AND UNTIL THAN WE CAN USE LOADING.TSX COMPONENT TO RENDER UNTIL IT LOADS

// HOME ASYNC EXPORT ELEMENT
export default async function Home() {
  // THESE ARE FUNCTIONS IN ACTIONS THAT GETS CALLED, THEY ARE SERVER SIDE FUCNTIONS THAT FETCH THE DATA
  // WE WILL SEE THEIR LOGIC BUT ASSUME THEY RETURN THE USER
  const user = await currentUser();
  const posts = await getPosts();
  const dbUserId = await getDbUserId();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {/*
          // IF NO USER THEN NULL ELSE WE RENDER CREATEPOST COMPONENT
        */}
        {user ? <CreatePost /> : null}

        {/*
          // WE RENDER POSTS
        */}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} dbUserId={dbUserId} />
          ))}
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        {/*
          // ELSE THE WHO FOLLOW DIV ON RIGHT
        */}
        
        <WhoToFollow />
      </div>
    </div>
  );
}
