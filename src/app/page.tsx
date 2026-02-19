import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const user = await verifyToken(token);

  if (!user) {
    redirect('/login');
  }

  // Redirect to role-specific dashboard
  const role = (user as any).role;
  redirect(`/dashboard/${role}`);
}
