import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminBookings from '@/components/admin/AdminBookings';

export const metadata = { title: 'Rezervacije — Admin | Ginko Sobe' };

export default async function AdminBookingsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return <AdminBookings />;
}
