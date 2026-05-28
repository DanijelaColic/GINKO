import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminRooms from '@/components/admin/AdminRooms';

export const metadata = { title: 'Sobe — Admin | Ginko Sobe' };

export default async function AdminRoomsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return <AdminRooms />;
}
