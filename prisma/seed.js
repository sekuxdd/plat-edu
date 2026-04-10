const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    return;
  }

  const teacher = await prisma.user.create({
    data: {
      name: "Pani Anna",
      email: "nauczyciel@demo.pl",
      passwordHash: await bcrypt.hash("teacher123", 10),
      role: "teacher",
    },
  });

  const student = await prisma.user.create({
    data: {
      name: "Jan Kowalski",
      email: "uczen@demo.pl",
      passwordHash: await bcrypt.hash("student123", 10),
      role: "student",
    },
  });

  const chapters = await Promise.all([
    prisma.chapter.create({ data: { title: "Język angielski - słownictwo", description: "Proste materiały i testy słówek dla początkujących.", order: 1 } }),
  ]);

  const chapterMap = new Map(chapters.map((chapter) => [chapter.title, chapter.id]));

  const topics = await Promise.all([
    prisma.topic.create({ data: { chapterId: chapterMap.get("Język angielski - słownictwo"), title: "Podstawowe słówka - poziom A1", description: "Nauka najczęściej używanych słówek angielskich.", order: 1 } }),
  ]);

  const topicMap = new Map(topics.map((topic) => [topic.title, topic.id]));

  await prisma.material.createMany({
    data: [
      { topicId: topicMap.get("Podstawowe słówka - poziom A1"), title: "Materiał 1: Słówka dom i rodzina", type: "Notatka", content: "house, room, kitchen, family, mother, father, sister, brother, baby, home", order: 1, published: true },
      { topicId: topicMap.get("Podstawowe słówka - poziom A1"), title: "Materiał 2: Słówka szkoła i przedmioty", type: "Notatka", content: "school, class, teacher, student, book, pen, pencil, desk, chair, notebook", order: 2, published: true },
    ],
  });

  await prisma.test.createMany({
    data: [
      { topicId: topicMap.get("Podstawowe słówka - poziom A1"), title: "Test angielski 1: Dom i rodzina", questionCount: 10, answerMode: "text", status: "Opublikowany", content: "house, room, kitchen, family, mother, father, sister, brother, baby, home", order: 1, published: true },
      { topicId: topicMap.get("Podstawowe słówka - poziom A1"), title: "Test angielski 2: Szkoła i przedmioty", questionCount: 10, answerMode: "abcd", status: "Opublikowany", content: "school, class, teacher, student, book, pen, pencil, desk, chair, notebook", order: 2, published: true },
    ],
  });

  console.log(`Seed completed for users ${teacher.email} and ${student.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });