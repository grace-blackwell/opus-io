'use client'

import React from 'react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, useReactTable} from '@tanstack/react-table'
import {useModal} from "@/providers/modal-provider";
import {Search} from "lucide-react";
import {Input} from "@/components/ui/input";

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
            <div className='w-full'>
                <div className='flex items-center py-4'>
                    <Input
                        placeholder={`Search Invoices...`}
                        value={(table.getColumn(filterValue)?.getFilterValue() as string) ?? ''}
                        onChange={(event) => table.getColumn(filterValue)?.setFilterValue(event.target.value)}
                        className='max-w-sm'
                    />
                </div>
            </div>
            <div>
                <Table className={'shadow-base-300/20 shadow-sm'}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} colSpan={header.colSpan}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (table.getRowModel().rows.map((row) =>
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) =>
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>)}
                                </TableRow>))
                            : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className='h-24 text-center'>
                                        No Invoices.
                                    </TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody>
                </Table>
            </div>
        </>
    )
}