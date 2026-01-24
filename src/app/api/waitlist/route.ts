import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "You're already on the waitlist!" },
        { status: 400 }
      );
    }

    // Insert new waitlist entry
    const { error } = await supabase.from("waitlist").insert({
      email: email.toLowerCase().trim(),
      source: "landing_page",
    });

    if (error) {
      console.error("Waitlist insert error:", error);

      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "You're already on the waitlist!" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined the waitlist!",
    });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Get waitlist count (for display purposes)
export async function GET() {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Waitlist count error:", error);
      return NextResponse.json({ success: true, count: 0 });
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    });
  } catch (error) {
    console.error("Waitlist count error:", error);
    return NextResponse.json({ success: true, count: 0 });
  }
}
