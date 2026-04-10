const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.chapter.deleteMany({
    where: {
      NOT: {
        title: {
          contains: "angielski",
        },
      },
    },
  });

  const chapter = await prisma.chapter.findFirst({
    where: {
      title: {
        contains: "angielski",
      },
    },
  });

  if (!chapter) {
    throw new Error("Nie znaleziono rozdziału z języka angielskiego.");
  }

  await prisma.topic.deleteMany({
    where: {
      chapterId: {
        not: chapter.id,
      },
    },
  });

  console.log("Usunięto nieangielskie rozdziały, tematy, materiały i testy.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
