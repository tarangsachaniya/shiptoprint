import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, imageUrl, w, h, shape } = await req.json();

  if (!imageUrl || !w || !h || !shape) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (id) {
    const { data, error } = await supabaseAdmin
      .from("designs")
      .update({
        image_url:    imageUrl,
        canvas_w:     w,
        canvas_h:     h,
        canvas_shape: shape,
        updated_at:   new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.userId)
      .select("id")
      .single();

    if (error || !data) {
      console.error("[designs] update error:", error);
      return NextResponse.json({ error: "Failed to update design" }, { status: 500 });
    }
    return NextResponse.json({ id: data.id });
  }

  const { data, error } = await supabaseAdmin
    .from("designs")
    .insert({
      user_id:      session.userId,
      image_url:    imageUrl,
      canvas_w:     w,
      canvas_h:     h,
      canvas_shape: shape,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[designs] insert error:", error);
    return NextResponse.json({ error: "Failed to save design" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("designs")
    .select("id, image_url, canvas_w, canvas_h, canvas_shape, created_at, updated_at")
    .eq("user_id", session.userId)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  return NextResponse.json({ designs: data });
}
