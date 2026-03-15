import { db } from "@/lib/db";
import { sendEmail, bookingEmailHtml } from "@/lib/email";
import { NotificationType, Role } from "@prisma/client";

async function getAllEmailsForUser(userId: string, primaryEmail: string): Promise<string[]> {
  const additional = await db.userEmail.findMany({ where: { userId }, select: { email: true } });
  return [primaryEmail, ...additional.map((e) => e.email)];
}

export async function createNotification({
  userId,
  userEmail,
  type,
  title,
  body,
  linkHref,
  sendMail = true,
}: {
  userId: string;
  userEmail: string;
  type: NotificationType;
  title: string;
  body: string;
  linkHref?: string;
  sendMail?: boolean;
}) {
  await db.notification.create({
    data: { userId, type, title, body, linkHref },
  });

  if (sendMail) {
    const allEmails = await getAllEmailsForUser(userId, userEmail);
    await sendEmail({
      to: allEmails,
      subject: title,
      html: bookingEmailHtml(title, body),
    });
  }
}

export async function notifyFamily({
  role,
  type,
  title,
  body,
  linkHref,
}: {
  role: Role;
  type: NotificationType;
  title: string;
  body: string;
  linkHref?: string;
}) {
  const users = await db.user.findMany({ where: { role } });
  for (const user of users) {
    await createNotification({ userId: user.id, userEmail: user.email, type, title, body, linkHref });
  }
}

export async function notifyAllExcept({
  excludeRole,
  type,
  title,
  body,
  linkHref,
}: {
  excludeRole: Role;
  type: NotificationType;
  title: string;
  body: string;
  linkHref?: string;
}) {
  const users = await db.user.findMany({ where: { role: { not: excludeRole } } });
  for (const user of users) {
    await createNotification({ userId: user.id, userEmail: user.email, type, title, body, linkHref });
  }
}
