

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');   // Direct dashboard pe bhej do
}