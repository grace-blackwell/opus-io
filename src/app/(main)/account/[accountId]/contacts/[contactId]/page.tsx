import React from 'react'
import { db } from '@/lib/db'
import { getAuthUserDetails } from '@/lib/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Phone, Globe, MapPin } from 'lucide-react'
import EditContactButton from '../_components/edit-contact-button'
import ContactTagDisplay from '@/components/global/contact-tag-display'
import {Badge} from "@/components/ui/badge";

type Props = {
  params: { accountId: string; contactId: string }
}

const ContactPage = async ({ params }: Props) => {
  const parameters = await params;
  const user = await getAuthUserDetails()
  if (!user || !user.Account) return null

  const contact = await db.contact.findUnique({
    where: {
      id: parameters.contactId
    },
    include: {
      ContactTags: true,
      BillingAddress: true,
      projects: {
        include: {
          Contract: true
        }
      },
      invoices: true
    }
  })
  
  console.log('Contact data:', JSON.stringify({
    id: contact?.id,
    contactName: contact?.contactName,
    ContactTags: contact?.ContactTags
  }, null, 2))

  if (!contact) return <div>Contact not found</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{contact.contactName}</h1>
          <div className="flex gap-2 mt-2">
            {contact.ContactTags.map(tag => {
              // Check if the color is a custom color (starts with CUSTOM:)
              const isCustomColor = tag.color.startsWith('CUSTOM:');
              const colorHex = isCustomColor ? tag.color.split(':')[1] : undefined;
              const colorName = isCustomColor ? 'CUSTOM' : tag.color;
              
              return (
                <ContactTagDisplay 
                  key={tag.id}
                  title={tag.name}
                  colorName={colorName}
                  colorHex={colorHex}
                />
              );
            })}
          </div>
        </div>
        <EditContactButton 
          user={user}
          contactId={contact.id}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact.contactEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-neutral-content" />
                <span>{contact.contactEmail}</span>
              </div>
            )}
            {contact.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-neutral-content" />
                <span>{contact.contactPhone}</span>
              </div>
            )}
            {contact.contactWebsite && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-neutral-content" />
                <span>{contact.contactWebsite}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {contact.BillingAddress && (
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-neutral-content mt-1" />
                <div>
                  <p>{contact.BillingAddress.street}</p>
                  <p>
                    {contact.BillingAddress.city}, {contact.BillingAddress.state} {contact.BillingAddress.zipCode}
                  </p>
                  <p>{contact.BillingAddress.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {contact.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contact.projects.map(project => (
                <div key={project.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{project.projectTitle}</h3>
                    <Badge>{project.status}</Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-neutral-content mt-2">{project.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {contact.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contact.invoices.map(invoice => (
                <div key={invoice.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Invoice #{invoice.invoiceNumber.toString()}</h3>
                    <Badge 
                      variant={invoice.paymentStatus === 'Paid' ? 'default' : 'destructive'}
                    >
                      {invoice.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-neutral-content">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                    <p className="font-medium">
                      {invoice.currency} {invoice.totalDue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ContactPage