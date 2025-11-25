import { PrismaClient, NotificationType } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follows.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      name: 'Alice Johnson',
      clerkId: `clerk_${uuidv4()}`,
      bio: 'Software developer and tech enthusiast',
      image: 'https://randomuser.me/api/portraits/women/1.jpg',
      location: 'San Francisco, CA',
      website: 'https://alice.dev',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      name: 'Bob Smith',
      clerkId: `clerk_${uuidv4()}`,
      bio: 'Digital artist and designer',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
      location: 'New York, NY',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      username: 'charlie',
      name: 'Charlie Brown',
      clerkId: `clerk_${uuidv4()}`,
      bio: 'Travel blogger and photographer',
      image: 'https://randomuser.me/api/portraits/men/2.jpg',
      website: 'https://charlie-travels.com',
    },
  });

  // Create follow relationships
  await prisma.follows.create({
    data: {
      followerId: user1.id,
      followingId: user2.id,
    },
  });

  await prisma.follows.create({
    data: {
      followerId: user1.id,
      followingId: user3.id,
    },
  });

  await prisma.follows.create({
    data: {
      followerId: user2.id,
      followingId: user1.id,
    },
  });

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      content: 'Just launched my new website! Check it out and let me know what you think. #webdev #launch',
      authorId: user1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content: 'Beautiful day for a hike! 🏞️ #outdoors #nature',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      authorId: user2.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      content: 'Working on some new designs. Here\'s a preview!',
      image: 'https://images.unsplash.com/photo-1547658719-da2b51169166',
      authorId: user3.id,
    },
  });

  // Create comments
  const comment1 = await prisma.comment.create({
    data: {
      content: 'Great job on the website! The design looks amazing.',
      authorId: user2.id,
      postId: post1.id,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: 'Thanks! I really appreciate it!',
      authorId: user1.id,
      postId: post1.id,
    },
  });

  // Create likes
  await prisma.like.create({
    data: {
      userId: user1.id,
      postId: post2.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: user3.id,
      postId: post2.id,
    },
  });

  // Create notifications
  await prisma.notification.create({
    data: {
      type: NotificationType.COMMENT,
      userId: user1.id, // Alice gets notified about the comment
      creatorId: user2.id, // Bob made the comment
      postId: post1.id,
      commentId: comment1.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: NotificationType.LIKE,
      userId: user2.id, // Bob gets notified about the like
      creatorId: user1.id, // Alice liked the post
      postId: post2.id,
    },
  });

  await prisma.notification.create({
    data: {
      type: NotificationType.FOLLOW,
      userId: user1.id, // Alice gets notified about the follow
      creatorId: user2.id, // Bob started following
    },
  });

  console.log('Database has been seeded successfully!');
  console.log('Sample users created:');
  console.log(`- ${user1.name} (@${user1.username})`);
  console.log(`- ${user2.name} (@${user2.username})`);
  console.log(`- ${user3.name} (@${user3.username})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
