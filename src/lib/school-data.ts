export type Role = "student" | "teacher";

export const publicHighlights = [
  {
    title: "Materiały w rozdziałach",
    description: "Porządkuj lekcje, tematy i pliki w logiczne ścieżki nauki.",
  },
  {
    title: "Testy i sprawdziany",
    description: "Buduj quizy, sprawdzaj wyniki i śledź postępy uczniów.",
  },
  {
    title: "Dwa tryby kont",
    description: "Osobny panel dla nauczyciela i ucznia po zalogowaniu.",
  },
];

export const roleLabels: Record<Role, string> = {
  student: "Uczeń",
  teacher: "Nauczyciel",
};

export const demoCredentials = {
  teacher: "nauczyciel@demo.pl / teacher123",
  student: "uczen@demo.pl / student123",
};

export const seedUsers = [
  {
    name: "Pani Anna",
    email: "nauczyciel@demo.pl",
    password: "teacher123",
    role: "teacher" as const,
  },
  {
    name: "Jan Kowalski",
    email: "uczen@demo.pl",
    password: "student123",
    role: "student" as const,
  },
];

export const seedChapters = [
  {
    title: "Język angielski - słownictwo",
    description: "Proste materiały i testy słówek dla początkujących.",
    order: 1,
  },
];

export const seedTopics = [
  {
    chapterTitle: "Język angielski - słownictwo",
    title: "Podstawowe słówka - poziom A1",
    description: "Nauka najczęściej używanych słówek angielskich.",
    order: 1,
  },
];

export const seedMaterials = [
  {
    topicTitle: "Podstawowe słówka - poziom A1",
    title: "Materiał 1: Słówka dom i rodzina",
    type: "Notatka",
    content: "house, room, kitchen, family, mother, father, sister, brother, baby, home",
    order: 1,
    published: true,
  },
  {
    topicTitle: "Podstawowe słówka - poziom A1",
    title: "Materiał 2: Słówka szkoła i przedmioty",
    type: "Notatka",
    content: "school, class, teacher, student, book, pen, pencil, desk, chair, notebook",
    order: 2,
    published: true,
  },
];

export const seedTests = [
  {
    topicTitle: "Podstawowe słówka - poziom A1",
    title: "Test angielski 1: Dom i rodzina",
    questionCount: 10,
    answerMode: "text",
    status: "Opublikowany",
    content: "house, room, kitchen, family, mother, father, sister, brother, baby, home",
    order: 1,
    published: true,
  },
  {
    topicTitle: "Podstawowe słówka - poziom A1",
    title: "Test angielski 2: Szkoła i przedmioty",
    questionCount: 10,
    answerMode: "abcd",
    status: "Opublikowany",
    content: "school, class, teacher, student, book, pen, pencil, desk, chair, notebook",
    order: 2,
    published: true,
  },
];