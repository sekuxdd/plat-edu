import { z } from "zod";

export const chapterInputSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  order: z.coerce.number().int().min(0),
});

export const topicInputSchema = z.object({
  chapterId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  order: z.coerce.number().int().min(0),
});

export const materialInputSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().min(2),
  type: z.string().min(1),
  content: z.string().min(1),
  order: z.coerce.number().int().min(0),
  published: z.coerce.boolean(),
});

export const testInputSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().min(2),
  questionCount: z.coerce.number().int().min(1),
  answerMode: z.enum(["text", "abcd"]),
  status: z.string().min(1),
  content: z.string().min(1),
  order: z.coerce.number().int().min(0),
  published: z.coerce.boolean(),
});