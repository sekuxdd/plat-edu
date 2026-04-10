import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  seedChapters,
  seedMaterials,
  seedTests,
  seedTopics,
  seedUsers,
} from "@/lib/school-data";

let bootstrapPromise: Promise<void> | null = null;

export function ensureSeeded() {
  if (!bootstrapPromise) {
    bootstrapPromise = seedDatabase();
  }

  return bootstrapPromise;
}

async function seedDatabase() {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    return;
  }

  for (const user of seedUsers) {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 10),
        role: user.role,
      },
    });
  }

  const createdChapters = new Map<string, string>();

  for (const chapter of seedChapters) {
    const record = await prisma.chapter.create({
      data: {
        title: chapter.title,
        description: chapter.description,
        order: chapter.order,
      },
    });

    createdChapters.set(chapter.title, record.id);
  }

  const createdTopics = new Map<string, string>();

  for (const topic of seedTopics) {
    const chapterId = createdChapters.get(topic.chapterTitle);

    if (!chapterId) {
      continue;
    }

    const record = await prisma.topic.create({
      data: {
        chapterId,
        title: topic.title,
        description: topic.description,
        order: topic.order,
      },
    });

    createdTopics.set(topic.title, record.id);
  }

  for (const material of seedMaterials) {
    const topicId = createdTopics.get(material.topicTitle);

    if (!topicId) {
      continue;
    }

    await prisma.material.create({
      data: {
        topicId,
        title: material.title,
        type: material.type,
        content: material.content,
        order: material.order,
        published: material.published,
      },
    });
  }

  for (const test of seedTests) {
    const topicId = createdTopics.get(test.topicTitle);

    if (!topicId) {
      continue;
    }

    await prisma.test.create({
      data: {
        topicId,
        title: test.title,
        questionCount: test.questionCount,
        status: test.status,
        content: test.content,
        order: test.order,
        published: test.published,
      },
    });
  }
}