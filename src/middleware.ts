import {clerkMiddleware, createRouteMatcher} from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/site", "/api/uploadthing"])

export default clerkMiddleware(async (auth, req) => {
    const {userId} = await auth()

    const url = req.nextUrl
    const searchParams = url.searchParams.toString()
    let hostName = req.headers

    const pathWithSearchParams = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`

    const customSubDomain = hostName
        .get('host')
        ?.split(`${process.env.NEXT_PUBLIC_DOMAIN}`)
        .filter(Boolean)[0]

    if (userId && !isPublicRoute(req)) {
        if (url.pathname.includes('/account')) {
            return NextResponse.rewrite(new URL(`${pathWithSearchParams}`, req.url));
        }
        if (customSubDomain)
            return NextResponse.rewrite(
                new URL(`/${customSubDomain}${pathWithSearchParams}`, req.url))
    }

    if (url.pathname === '/sign-in' || url.pathname === '/sign-up') {
        return NextResponse.redirect(new URL(`/account/sign-in`, req.url));
    }

    if (url.pathname === '/' ||
        (url.pathname === '/site' && url.host === process.env.NEXT_PUBLIC_DOMAIN)) {
        return NextResponse.rewrite(new URL('/site', req.url));
    }
})


export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}