"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deliverSubmissionNotification } from "@/lib/notifications";
export async function retryNotificationAction(form: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(form.get("notificationId"));
  await deliverSubmissionNotification(id);
  revalidatePath("/admin-portal/notifications");
  revalidatePath("/admin-portal/leads", "layout");
}
