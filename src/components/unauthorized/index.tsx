import Link from 'next/link'
import React from 'react'

type Props = {}

const Unauthorized = (props: Props) => {
  return (
    <div className='p-4 text-center h-screen w-screen flex justify-center items-center flex-col'>
      <h1 className='text-3xl md:text-6xl'>Unauthorized</h1>
        <p>Please go back or contact support for assistance.</p>
        <Link href='/' className='mt-4 bg-primary p-2'>Back to home</Link>
    </div>
  )
}

export default Unauthorized