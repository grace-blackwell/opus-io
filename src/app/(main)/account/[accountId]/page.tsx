import React from 'react'

const Page = async ({ params }: { params: { accountId: string } }) => {
  const parameters = await params
  return <div>{parameters.accountId}</div>;
};

export default Page;