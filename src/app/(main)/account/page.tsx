import React from 'react'
import {currentUser} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import {getAuthUserDetails, verifyAndAcceptAccount} from "@/lib/queries";
import AccountDetails from "@/components/forms/account-details";

const Page = async ({ searchParams }: {searchParams: {plan: string; state: string; code: string}}) => {

	const accountId = await verifyAndAcceptAccount()
	console.log(accountId)

	const user = await getAuthUserDetails()
	// Await searchParams to satisfy Next.js requirements
	const params = await Promise.resolve(searchParams)
	
	if (accountId) {
		if (params.plan) {
			return redirect(`/account/${accountId}/billing?plan=${params.plan}`)
		}
		if (params.state) {
			const statePath = params.state.split('__')[0];
			const stateAccountId = params.state.split('___')[1];
			if (!stateAccountId) return <div>Not Authorized</div>;
			return redirect(`/account/${stateAccountId}/${statePath}?code=${params.code}`)
		} else return redirect(`/account/${accountId}`)
	}

	const authUser = await currentUser()
	return (
		<div className="relative h-full w-full min-h-screen">
			{/* Grid pattern background */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: "linear-gradient(to right, rgba(79, 79, 79, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(79, 79, 79, 0.18) 1px, transparent 1px)",
					backgroundSize: "14px 24px",
					maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
					WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)"
				}}
			></div>
			{/* Mesh gradient overlay for entire background */}
			{/*<div*/}
			{/*	className="absolute inset-0 z-[1] w-screen"*/}
			{/*	style={{*/}
			{/*		background: "radial-gradient(at 95.20474137931035% 88.75%, #9013fe 0px, transparent 50%), radial-gradient(at 8.028017241379311% 14.374999999999998%, #9013fe 0px, transparent 50%), #FC913A",*/}
			{/*		opacity: 0.5,*/}
			{/*		maskImage: "linear-gradient(to right, rgba(0, 0, 0, 1) 60%, transparent 100%)",*/}
			{/*		WebkitMaskImage: "linear-gradient(to right, rgba(0, 0, 0, 1) 60%, transparent 100%)"*/}
			{/*	}}*/}
			{/*></div>*/}

			{/* Content container - positioned above the grid */}
			<div className="relative z-10 flex flex-col md:flex-row min-h-screen">
				{/* Left side with mesh gradient and tagline */}
				<div className="w-full md:w-2/5 flex items-center justify-center p-8 relative overflow-hidden">

					{/* Tagline */}
					<div className="relative z-10 text-center md:text-left max-w-md mx-auto md:mx-0 px-4 md:mt-[-300px]">
						<h2 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-lg leading-tight">
							Take your
							<span className="bg-gradient-to-l from-orange-500 to-purple-600 text-transparent bg-clip-text"> gig work </span>
							to the next level <span role="img" aria-label="rocket">🚀</span>
						</h2>
					</div>
				</div>

				{/* Right side with account creation form */}
				<div className="w-full md:w-3/5 flex items-center justify-center p-4 md:p-8">
					<div className="w-full max-w-[900px] p-4 md:p-8 rounded-xl bg-background/80 backdrop-blur-sm">
						<h1 className="text-3xl md:text-4xl font-bold">
							Let's create your
							<span className="bg-gradient-to-l from-orange-500 to-purple-600 text-transparent bg-clip-text drop-shadow-lg"> Opus </span>
							Account
						</h1>
						<p className="text-muted-foreground mt-4">
							You can edit your account settings later from the settings tab.
						</p>
						<div className="mt-6">
							<AccountDetails data={{
								accountEmail: authUser?.emailAddresses[0].emailAddress,
								accountName: authUser?.firstName + ' ' + authUser?.lastName
							}}/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Page