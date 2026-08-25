"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CardFormState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "uploaded" };

export async function submitStudentCardAction(
  _prev: unknown,
  formData: FormData
): Promise<CardFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "login_required" };

  const file = formData.get("card");
  if (!(file instanceof File) || file.size === 0)
    return { status: "error", error: "upload_failed" };
  if (file.size > 5 * 1024 * 1024)
    return { status: "error", error: "upload_failed" };
  if (!/^image\/(jpeg|png|webp)$/.test(file.type))
    return { status: "error", error: "upload_failed" };

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${user.id}/card-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("student-cards")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { status: "error", error: "upload_failed" };

  const { error: rpcError } = await supabase.rpc("submit_student_card", {
    p_path: path,
  });
  if (rpcError) return { status: "error", error: "upload_failed" };

  revalidatePath("/verify");
  return { status: "uploaded" };
}
