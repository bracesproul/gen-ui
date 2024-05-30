import { Mail } from "@/components/prebuilt/mail/mail";
import { z } from "zod";
import { faker } from "@faker-js/faker";
import { format } from "date-fns";

export const emailSchema = z.object({
  email: z.string().describe("The email to get inbox for"),
});

export function getEmailData(): Mail[] {
  return Array.from({ length: 5 }).map((_) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    subject: faker.lorem.sentence(),
    text: faker.lorem.paragraph({ min: 3, max: 15 }),
    date: format(faker.date.recent(), "MMM dd, yyyy, h:mm:ss a"),
    read: faker.datatype.boolean(),
    labels: faker.helpers.arrayElements(
      Array.from({ length: 10 }).map((_) => faker.hacker.ingverb()),
      { min: 2, max: 4 },
    ),
  }));
}
