import { NextResponse } from 'next/server';
import { get_readings, put_readings } from '@/data.js'

export async function GET(req, {params}) {
	const {id} = await params;
	return NextResponse.json(get_readings(id, 0, 18446744073709551615));
}

export async function PUT(req, {params}) {
	const {id} = await params;
	const data = await req.json();
	put_readings(id, data);
	return NextResponse.json('success');
}
