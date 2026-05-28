import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import Link from 'next/link';

export const metadata = { title: 'Admin | Ginko Sobe' };

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-semibold text-gray-900">Ginko Sobe — Admin</h1>
          <p className="text-gray-500 mt-1">Dobrodošli u admin panel</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/admin/bookings', label: 'Rezervacije', desc: 'Pregled i upravljanje', color: 'bg-primary' },
            { href: '/admin/calendar', label: 'Kalendar', desc: 'Dostupnost i blokade', color: 'bg-emerald-600' },
            { href: '/admin/pricing', label: 'Cijene', desc: 'Sezonske cijene', color: 'bg-amber-500' },
            { href: '/admin/rooms', label: 'Sobe', desc: 'Sadržaj i prijevodi', color: 'bg-blue-600' },
            { href: '/admin/channels', label: 'Kanali', desc: 'iCal uvoz/izvoz', color: 'bg-purple-600' },
            { href: '/admin/payments', label: 'Plaćanja', desc: 'Stripe statusi i linkovi', color: 'bg-rose-600' },
          ].map(({ href, label, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group"
            >
              <div className={`w-8 h-8 ${color} rounded-lg mb-3`} />
              <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                {label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
