import React from 'react'
import {currentUser} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import {getAuthUserDetails, verifyAndAcceptUser} from "@/lib/queries";

const Page = async () => {
	// const userId = await verifyAndAcceptUser()
	// console.log(userId)
	//
	// const user = await getAuthUserDetails()
	return <div>User Dashboard</div>
}

export default Page