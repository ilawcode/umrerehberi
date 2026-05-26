import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';

export async function GET() {
  try {
    await dbConnect();
    const notes = await Note.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    console.error('Notes fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    if (!body.text || body.text.trim() === '') {
      return NextResponse.json({ success: false, error: 'Not metni boş olamaz.' }, { status: 400 });
    }
    const note = await Note.create({ text: body.text });
    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    console.error('Note create error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Kimlik (id) belirtilmedi.' }, { status: 400 });
    }
    const updatedNote = await Note.findByIdAndUpdate(
      body.id,
      { completed: body.completed },
      { new: true }
    );
    if (!updatedNote) {
      return NextResponse.json({ success: false, error: 'Not bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedNote });
  } catch (error: any) {
    console.error('Note update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Kimlik (id) belirtilmedi.' }, { status: 400 });
    }
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) {
      return NextResponse.json({ success: false, error: 'Not bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Not silindi.' });
  } catch (error: any) {
    console.error('Note delete error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
