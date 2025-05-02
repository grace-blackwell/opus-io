import React from "react";

export default function AuthLayout({children}: {children: React.ReactNode}) {
    return <div className='pt-30 flex items-center justify-center'>
        {children}
    </div>
}