import { type NextRequest, NextResponse } from "next/server";
import { createClient } from '@/utils/supabase/server';

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = await createClient()
    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const user_response = await supabase.auth.getUser();
    if (user_response.data.user == null && request.nextUrl.pathname !== "/login" && 
        !request.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    if (request.nextUrl.pathname.startsWith('/login') && user_response.data.user != null) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};