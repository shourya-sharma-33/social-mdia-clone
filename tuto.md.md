# setting up nextjs

```
npx create-npx-app@14.2.25
```
 
you will get a folder structure like
```
> .next
> node_modules
> src
> .gitignore
> next-env.d.ts
> next.config.mjs
> package-lock.json
> package.json
> postcss.config.mjs
> README.md
> tailwind.config.ts
> tsconfig.json
```

we work in `src`
src will have
```
> favicon.ico
> global.css
> layout.tsx
> page.tsx
```

now in page.tsx whatever component we make will be rendered
in the root

to make routes
we make app folder 
and whatever we name that folder will become that route

```
src/app/about/page.sx
```

this page.tsx will render on localhost:3000/about

page.tsx has what to render
layout.tsx always has a export function and tells us what the layout of the page


now whats so good about nextjs

you have a terminal running and a client side code runnuing on browser
now 


in about
```tsx
function AboutPage() {
    console.log("shorua");
    return <div>Hello</div>

}
```

the console.log will happen in the terminal not the client side browser
this makes our work so much more easy
we can write client and server code in one file and make it all the more easy
we can interact and manipulate data from our database and render to client right from the same file

in app/layout.tsx
this layout is global and shared to every route


now we use clerk for our authentication provider for our application 

make a application in clerk
and then we install clerk in our app
and put relevant keys in .env

visit the page for the setup
its only a three step 

now we edit authentication page
```tsx
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignOutButton
} from "@clerk/next.js";

export default function Home(){
    return(
        <div>
            <SignedOut>
                this is button to sign in
                <SignInButton mode="model">
            <SignedOut>

            <SignedIn>
               <HomePage/>
               <UserButton/>
            <SignedIn>
        </div>
    )
}
```

the logic is simple
when not signed in render components wraped in signedout

when signed in then render compo
mode="model" wont redirect you

user button to render user settingsand all

now we install shadcn
you go to their library and its gonna work 
we eill use components from here


we use these components to build authentication
now lets discuss database 
we will use prisma as orm

(object relational mapping)
prisma is a translator between code and database
prisma is orm
postgres is a database

without orm is kinda goofy with sql for complex shit

entire prisma code
we run prisma init (chat gpt please write these setup steps ok)

we get a folder prisma with a file schema.prosma
```js
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    url = env("database_url")
}

model User {
    // schema for datapoint
    id String @id @default(cuid())
    email String @unique
    username String @unique
    clerkId String @unique
    name String?
    bio String?
    image String?
    location String?
    website String?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // relation
    posts Post[]
    comments Comment[]
    like Like[]

    followers follows[] @relation("following") // users who follow this user
    // i see this form of relation as, followers of follow type that contain this user in its following
    // this is how i read this shit

    following follows[] @relation("followers") // users this user follows

    notification Notification[] @relation("userNotifications")
    notification Notification[] @relation("notificationCreator")
}

model Post{
    id String @id @default(cuid())
    authorId String
    content String?
    image String?
    createdAt DateTime @default(now())
    updateAt DateTime @updatedAt

    // relations
    author User @relation(
        fields : [authorId], 
        redrences : [id],
        //  i read it as field of author id refrences to id of the User
        onDelete : Cascade // on delete of user posts delete
    )
    comments Comment[]
    likes Like[]
    notifications Notifications[]
}

model Comment{
    id String @id @default(cuid())
    content String
    authorId String
    postId Sting
    createdAt DateTime @default(now())

    // relations
    author User @relation(fields : [authorId], refrences : [id], onDelete : Cascade)
    post Post @realtion(fields : [postId], refrences : [id], onDelete : Cascade)
    
    @@index([authorId, postId]) // we can add indexes to this model we can get comments filtered, i like to call it as, return all comments made by this user on this post
}

model Like {
    id String @id @default(cuid())
    postId String
    userId String
    createdAt DateTime @default(now())
    
    // Relations
    user User @relation(
        field : [userId],
        refrences : [id],
        onDelete : Cascade
    )
    post Post @realtion(fields : [postId], refrences: [id], onDelete: Cascade)

  @@index([userId,postId]) // composite index for faster queries
  @@unique([userId,postId]) // this prevents same user liking post twice
}

model Follows{
  followerId String
  followingId String
  createdAt DateTime @default(now())

  // Relations
  follower    User     @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("following", fields: [followingId], references: [id], onDelete: Cascade)

  @@index([followerId,followingId]) // composite index for faster queries
  @@id([followerId, followingId]) // composite primary key prevents duplicate follows
}

model Notification {
  id        String   @id @default(cuid())
  userId    String                  
  creatorId String                  
  type      NotificationType        
  read      Boolean  @default(false)
  postId    String?                 
  commentId String?                
  createdAt DateTime @default(now())
  
  // Relations
  user      User     @relation("userNotifications", fields: [userId], references: [id], onDelete: Cascade)
  creator   User     @relation("notificationCreator", fields: [creatorId], references: [id], onDelete: Cascade)
  post      Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment   Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}

enum NotificationType {
  LIKE     
  COMMENT 
  FOLLOW   
}
```
we run `npx prisma db push`
to push schema to neon db

now in src/lib/prisma.ts
```
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

```


now we learn how to use this shit
say in navbar
we have to sync the user
say this is navbar component

```
import Link from "next/link";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";
import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user.action";

async function Navbar() {
  const user = await currentUser();
  if (user) await syncUser(); // POST

  return (
    <nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary font-mono tracking-wider">
              Socially
            </Link>
          </div>

          <DesktopNavbar />
          <MobileNavbar />
        </div>
      </div>
    </nav>
  );
}
export default Navbar;

```

we post user to the database

```
if (user) await syncUser(); // POST
```

in src/actions/user.action.ts
we will understand it in detail in main code commented
you just know this is how we work with prijma
```js
export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (existingUser) return existingUser;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });

    return dbUser;
  } catch (error) {
    console.log("Error in syncUser", error);
  }
}
```

sidebar logic is like
if user is authenticated then show unauthenticatedsidebar else show normal sidebar

```js
import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { getUserByClerkId } from "@/actions/user.action";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { LinkIcon, MapPinIcon } from "lucide-react";

async function Sidebar() {
 // we define current user in actions
  const authUser = await currentUser();
  if (!authUser) return <UnAuthenticatedSidebar />;

// we also fetch the user we drfine logic in actions
  const user = await getUserByClerkId(authUser.id);
  if (!user) return null;

  return (
    <div>authenticated</div>
  );
}

export default Sidebar;

const UnAuthenticatedSidebar = () => (
 return <div> unauthenticated </div>
);

```
my point is u can edit server actions in action file without the whole
create a backend and connect using cors and then making a zustand state


this was kinda the intro to this project
nextjs isnt that hard go read the main docs and u will know more :3
