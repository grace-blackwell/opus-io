'use server'

import Stripe from 'stripe'
import {db} from '@/lib/db'
import { stripe } from '.'

export const subscriptionCreated = async (subscription: Stripe.Subscription, customerId: string) => {
  try {
      const account = await db.account.findFirst({
          where: {
              customerId
          },
          include: {
              Subscription: true,
          }
      })
      if (!account) {
          throw new Error('Could not find account to upsert subscription for customerId: ' + customerId)
      }

      const data = {
          active: subscription.status === 'active',
          accountId: account.id,
          customerId,
          currentPeriodEndDate: new Date(subscription.current_period_end * 1000),
          //@ts-ignore
          priceId: subscription.plan.id,
          subscriptionId: subscription.id,
          // @ts-ignore
          plan: subscription.plan.id,
      }

      const response = await db.subscription.upsert({
          where: {
              accountId: account.id
          },
          create: data,
          update: data
      })
      console.log(`Subscription ${subscription.id} created for ${customerId}`)

  } catch (error) {
      console.log(`Error creating subscription... ${JSON.stringify(error)}`)
  }
}

export const getConnectAccountProducts = async (stripeAccount: string) => {
    const products = await stripe.products.list(
        {
            limit: 50,
            expand: ['data.default_price'],
        },
        {
            stripeAccount
        }
    )
    return products.data
}