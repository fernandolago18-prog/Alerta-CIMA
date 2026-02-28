import { NextResponse, NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/", "/inventario", "/alertas", "/configuracion"];
const publicRoutes = ["/login"];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.includes(path);
    const isPublicRoute = publicRoutes.includes(path);

    const cookie = req.cookies.get("session")?.value;
    const session = await decrypt(cookie);

    if (isProtectedRoute && !session?.authenticated) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (isPublicRoute && session?.authenticated) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
