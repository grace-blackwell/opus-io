import React from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {db} from "@/lib/db";
import {CheckCircleIcon} from "lucide-react";
import Link from "next/link";

type Props = {
    params: {
        accountId: string
    }
    searchParams: {code: string}
}

const LaunchpadPage = async ({params, searchParams}: Props) => {
    const parameters = await params
    const accountDetails = await db.account.findUnique({
        where: {
            id: parameters.accountId
        }
    })

    if (!accountDetails) return

    const allDetailsExist =
        accountDetails.accountName &&
        accountDetails.accountEmail &&
        accountDetails.title &&
        accountDetails.logo &&
        accountDetails.userId &&
        accountDetails.address &&
        accountDetails.city &&
        accountDetails.state &&
        accountDetails.zipCode &&
        accountDetails.country

  return (
      <div className='flex flex-col items-center justify-center max-w-4xl'>
          <div className='w-full h-full max-w[800px]'>
              <Card className='border-none rounded-none shadow-none'>
                  <CardHeader>
                      <CardTitle>Let's get started!</CardTitle>
                      <CardDescription>
                          Follow the steps below to set up your account and start working on your first project.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className='flex flex-col gap-4'>
                      <div className='flex justify-between bg-background items-center w-full p-4 gap-2'>
                          <div className='flex md-items-center gap-4 flex-col md:!flex-row'>
                              <Image src='/appstore.png' alt='app logo' height={60} width={60}
                                     className='rounded-md object-contain'/>
                              <p>Save Opus as a shortcut on your mobile device</p>
                          </div>
                          <Button>Go</Button>
                      </div>

                      <div className='flex justify-between bg-background items-center w-full p-4 gap-2'>
                          <div className='flex md-items-center gap-4 flex-col md:!flex-row'>
                              <Image src='/stripelogo.png' alt='app logo' height={60} width={60}
                                     className='rounded-md object-contain'/>
                              <p>Connect your Stripe account to accept payments and see your dashboard</p>
                          </div>
                          <Button>Go</Button>
                      </div>

                      <div className='flex justify-between bg-background items-center w-full p-4 gap-2'>
                          <div className='flex md-items-center gap-4 flex-col md:!flex-row'>
                              <Image src={accountDetails.logo} alt='app logo' height={40} width={40}
                                     className='rounded-md object-contain'/>
                              <p>Fill in all your business details</p>
                          </div>
                          {allDetailsExist ? (<CheckCircleIcon size={40} className="text-primary p-2 flex-shrink-0"/>) :
                              (<Link href={`account/${parameters.accountId}/settings`}
                              className='bg-primary py-2 px-4 rounded-md text-white'>
                                  Go
                              </Link>)}
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
  )
}

export default LaunchpadPage