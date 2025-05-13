import { NextResponse } from 'next/server';
import { get_readings, put_readings } from '@/data.js'

export async function GET(req, {params}) {
	const {id, t0} = await params;
	return NextResponse.json(get_readings(id, t0));
}
