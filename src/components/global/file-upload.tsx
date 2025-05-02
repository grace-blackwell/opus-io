'use client'

import React from 'react'
import {FileIcon, X} from "lucide-react";
import Image from 'next/image';
import {Button} from '../ui/button';
import {UploadDropzone} from "@/lib/uploadthing";
import {twMerge} from 'tailwind-merge';

type Props = {
	apiEndpoint: 'logo' | 'avatar' | 'media'
	onChange: (url?: string) => void
	value?: string
}

const FileUpload = ({ apiEndpoint, onChange, value }: Props) => {
	const type = value?.split('.').pop()

	if(value){
		return <div className='flex flex-col justify-center items-center !border-dashed'>
			{type !== 'pdf' ? (
				<div className='relative w-40 h-40'>
					<Image
						src={value}
						alt='uploaded image'
						className='object-contain'
						fill/>
				</div>
				)
				: (
					<div className='relative flex items-center p-2 mt-2 rounded-md bg-input'>
						<FileIcon className="h-5 w-5" />
						<a
							href={value}
							target='_blank'
							rel='noopener noreferrer'
							className='ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline'
						>
							View PDF
						</a>
					</div>
				)}
			<Button onClick={() => onChange('')} variant='ghost' type='button'>
				<X className='h-4 w-4 text-foreground bg-primary'/>
				Remove {type === 'pdf' ? 'PDF' : 'Image'}
			</Button>
		</div>
	}

	return <div className='w-full bg-muted justify-center'>
		<UploadDropzone
			endpoint={apiEndpoint}
			onClientUploadComplete={(res) => {
				onChange(res?.[0].url)
			}}
			onUploadError={(error) => {
				console.log(error);
			}}
			className='border-muted bg-input p-4'
			appearance={{
				button: "bg-primary p-2",
				label: "text-secondary",
			}}
		/>
	</div>
}

export default FileUpload