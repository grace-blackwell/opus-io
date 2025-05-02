'use client'

import React from 'react'
import {useModal} from "@/providers/modal-provider";
import {Button} from "@/components/ui/button";
import CustomModal from "@/components/global/custom-modal";
import UploadMediaForm from "@/components/forms/upload-media";

type Props = {
    accountId: string
}

const MediaUploadButton = ({accountId}: Props) => {
    const {isOpen, setOpen, setClose} = useModal()

    return (
        <Button onClick={() => setOpen(<CustomModal title='Upload Media' subheading='Upload a file to your media bucket'>
            <UploadMediaForm accountId={accountId} />
        </CustomModal>)}>
            Upload
        </Button>
    )
}

export default MediaUploadButton