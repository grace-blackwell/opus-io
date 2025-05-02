import React from 'react'
import {getMedia} from "@/lib/queries";
import BlurPage from "@/components/global/blur-page";
import MediaComponent from "@/components/media";

type Props = {
    params: {accountId: string}
}

const MediaPage = async ({params}: Props) => {
    const parameters = await params
    const data = await getMedia(parameters.accountId)
    return (
        <BlurPage>
           <MediaComponent
               data={data}
               accountId={parameters.accountId}
           />
        </BlurPage>
    )
}

export default MediaPage