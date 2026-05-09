import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const session = await verifyToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
