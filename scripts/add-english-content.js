const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function ensureChapter() {
  const existing = await prisma.chapter.findFirst({
    where: { title: "Język angielski - słownictwo" },
  });

  if (existing) {
    return existing;
  }

  return prisma.chapter.create({
    data: {
      title: "Język angielski - słownictwo",
      description: "Proste materiały i testy słówek dla początkujących.",
      order: 4,
    },
  });
}

async function ensureTopic(chapterId) {
  const existing = await prisma.topic.findFirst({
    where: { title: "Podstawowe słówka - poziom A1" },
  });

  if (existing) {
    return existing;
  }

  return prisma.topic.create({
    data: {
      chapterId,
      title: "Podstawowe słówka - poziom A1",
      description: "Nauka najczęściej używanych słówek angielskich.",
      order: 1,
    },
  });
}

async function ensureMaterials(topicId) {
  const items = [
    {
      title: "Materiał 1: Słówka dom i rodzina",
      content:
        "house, room, kitchen, family, mother, father, sister, brother, baby, home",
      order: 1,
    },
    {
      title: "Materiał 2: Słówka szkoła i przedmioty",
      content:
        "school, class, teacher, student, book, pen, pencil, desk, chair, notebook",
      order: 2,
    },
  ];

  for (const item of items) {
    const exists = await prisma.material.findFirst({ where: { title: item.title } });

    if (!exists) {
      await prisma.material.create({
        data: {
          topicId,
          title: item.title,
          type: "Notatka",
          content: item.content,
          order: item.order,
          published: true,
        },
      });
    }
  }
}

async function ensureTests(topicId) {
  const items = [
    {
      title: "Test angielski 1: Dom i rodzina",
      content:
        "house, room, kitchen, family, mother, father, sister, brother, baby, home",
      order: 1,
      answerMode: "text",
    },
    {
      title: "Test angielski 2: Szkoła i przedmioty",
      content:
        "school, class, teacher, student, book, pen, pencil, desk, chair, notebook",
      order: 2,
      answerMode: "abcd",
    },
  ];

  for (const item of items) {
    const exists = await prisma.test.findFirst({ where: { title: item.title } });

    if (!exists) {
      await prisma.test.create({
        data: {
          topicId,
          title: item.title,
          questionCount: 10,
          answerMode: item.answerMode,
          status: "Opublikowany",
          content: item.content,
          order: item.order,
          published: true,
        },
      });
    }
  }
}

async function main() {
  const chapter = await ensureChapter();
  const topic = await ensureTopic(chapter.id);

  await ensureMaterials(topic.id);
  await ensureTests(topic.id);

  console.log("Dodano 2 materiały i 2 testy z języka angielskiego.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
