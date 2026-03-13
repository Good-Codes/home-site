// app/api/contact/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
   
    const body = await request.json();
    const { name, email, phone, details } = body;

    if (!name || !email || !details) {
      return NextResponse.json(
        { error: "Name, email, and details are required." },
        { status: 400 }
      );
    }

     return NextResponse.json(
      { message: "Form submitted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing form:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}