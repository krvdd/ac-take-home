import { NextResponse } from 'next/server';
import { put_plant, delete_plant } from '@/data.js'

export async function PUT(req, {params}) {
	const {id} = await params;
	const data = await req.json();
	await put_plant(id, data);
	return NextResponse.json('success');
}

export async function DELETE(req, {params}) {
	const {id} = await params;
	await delete_plant(id);
	return NextResponse.json('success');
}
