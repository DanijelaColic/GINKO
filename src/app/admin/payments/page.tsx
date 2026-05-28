import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminPayments from '@/components/admin/AdminPayments';

export const metadata = { title: 'Plaćanja — Admin | Ginko Sobe' };

export default async function AdminPaymentsPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return <AdminPayments />;
}
