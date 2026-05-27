import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() || null : null;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email is required" }, { status: 422 });
  }

  const { error } = await supabase.from("waitlist").insert({ name, email, phone });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
