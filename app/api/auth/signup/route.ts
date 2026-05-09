import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/client";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .insert({ email, password_hash, role: "user" })
    .select("id, email, role")
    .single();

  if (error || !user) {
    console.error("[signup] Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  await createSession({ userId: user.id, email: user.email, role: user.role });

  return NextResponse.json({ role: user.role });
}
