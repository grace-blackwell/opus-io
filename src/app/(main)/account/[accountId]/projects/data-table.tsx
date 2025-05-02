'use client'

import React from 'react'
import {Table, TableBody, TableCell, TableHeader, TableRow} from '@/components/ui/table'
import {ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable} from '@tanstack/react-table'
import {useModal} from "@/providers/modal-provider";
import {Plus, Search} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import CustomModal from "@/components/global/custom-modal";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	filterValue: string
	actionButtonText?: React.ReactNode
	modalChildren?: React.ReactNode
}

export default function DataTable<TData, TValue>({columns, data, filterValue, actionButtonText = '', modalChildren}: DataTableProps<TData, TValue>) {
	const {setOpen} = useModal()
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	})

	return (
		<>
			<div className='flex items-center justify-between'>
				<div className='flex items-center py-4 gap-2'>
					<Search />
					<Input
						placeholder='Search Projects...'
						value={(table.getColumn(filterValue)?.getFilterValue() as string) ?? ''}
						onChange={(event) => table.getColumn(filterValue)?.setFilterValue(event.target.value)}
						className='h-8'
					/>
				</div>
				<Button
					className='flex gap-2'
					onClick={() => {
						setOpen(<CustomModal title='Add a Project' subheading='Enter the project details'>
							{modalChildren}
						</CustomModal>)
					}}>
					<Plus size={15} className="mr-2" />
					{actionButtonText}
				</Button>
			</div>
			<div className='bg-muted rounded-lg'>
				<Table>
					<TableHeader className='text-xs'>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<th key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</th>
									)
								})}
							</tr>
						))}
					</TableHeader>
					<TableBody className='text-xs'>
						{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) =>
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && 'selected'}>
								{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
							</TableRow>)
							:
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='h-24 text-center'>
									No Projects.
								</TableCell>
							</TableRow>
						}
					</TableBody>
				</Table>
			</div>
		</>
	)
}
