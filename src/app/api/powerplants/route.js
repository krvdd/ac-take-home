import { NextResponse } from 'next/server';
import { get_plants, add_plant } from '@/data.js'

export function GET(req) {
	return NextResponse.json(get_plants());
}

export async function POST(req) {
	add_plant(await req.json());
	return NextResponse.json('success');
}
