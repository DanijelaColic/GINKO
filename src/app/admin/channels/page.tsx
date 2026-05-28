import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminChannels from '@/components/admin/AdminChannels';

export const metadata = { title: 'Kanali — Admin | Ginko Sobe' };

export default async function AdminChannelsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return <AdminChannels />;
}
