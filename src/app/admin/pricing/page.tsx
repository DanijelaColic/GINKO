import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminPricing from '@/components/admin/AdminPricing';

export const metadata = { title: 'Cijene — Admin | Ginko Sobe' };

export default async function AdminPricingPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return <AdminPricing />;
}
