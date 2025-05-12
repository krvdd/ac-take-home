import { NextResponse } from 'next/server';
import { get_plants, add_plant } from '@/data.js'

export async function GET(req) {
	return NextResponse.json(await get_plants());
}

export async function POST(req) {
	await add_plant(await req.json());
	return NextResponse.json('success');
}
