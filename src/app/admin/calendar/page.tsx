import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminCalendar from '@/components/admin/AdminCalendar';

export const metadata = { title: 'Kalendar — Admin | Ginko Sobe' };

export default async function AdminCalendarPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return <AdminCalendar />;
}
