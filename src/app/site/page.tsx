import Image from "next/image";
import {pricingCards} from "@/lib/constants";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {clsx} from "clsx";
import {Check} from "lucide-react";
import Link from "next/link";

export default async function Home() {
  return (
      <>
        <section className="relative h-screen">
          <div className="absolute inset-0">
            <div
                className="relative h-full w-full [&>div]:absolute [&>div]:inset-0 [&>div]:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [&>div]:bg-[size:14px_24px] [&>div]:[mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]">
              <div></div>

            </div>
          </div>
          <div className="relative z-10 flex h-full flex-col items-center pt-40 px-4">
            <div className="max-w-3xl text-center">
              <h1 className="mb-8 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Streamline your
                <span
                    className="bg-gradient-to-l from-purple-700 to-orange-500 text-transparent bg-clip-text"> Freelance </span>
                business on a single platform
              </h1>
            </div>
          </div>
        </section>
        <section className="flex justify-center items-center flex-col gap-4 md:mt-[-70]">
          <h2 className="text-4xl text-center">All the tools you need in one place</h2>
          <p className="text-muted-foreground text-center">
            Choose a plan to get started
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap mt-6">
            {pricingCards.map((card) => (
                //TODO: Wire up free product from Stripe
                <Card key={card.title} className={clsx('w-[300px] flex flex-col',{"boarder-2 border-primary": card.title === 'Ultimate'})}>
                  <CardHeader>
                    <CardTitle className={clsx('text-3xl', {'text-muted-foreground': card.title !== 'Ultimate'})}>
                      {card.title}
                    </CardTitle>
                    <CardDescription>
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className='text-4xl font-bold'>{card.price}</span>
                    <span className='text-muted-foreground'> /m</span>
                  </CardContent>
                  <CardFooter className='flex flex-col items-start gap-4'>
                    <div>
                      {card.features.map((feature) => (
                          <div key={feature} className='flex items-center gap-2'>
                            <Check className='text-muted-foreground' />
                            {feature}
                          </div>
                      ))}
                    </div>
                    <Link href={`/user?plan={card.priceId}`}
                    className='w-full text-center bg-primary p-2 rounded-md'>
                      Get Started
                    </Link>
                  </CardFooter>
                </Card>
            ))}
          </div>
        </section>
      </>
  );
}
