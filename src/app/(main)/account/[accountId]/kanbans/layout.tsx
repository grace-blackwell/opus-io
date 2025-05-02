import BlurPage from "@/components/global/blur-page";


const KanbanLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<BlurPage>{children}</BlurPage>
	)
}

export default KanbanLayout