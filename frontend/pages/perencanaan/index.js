// pages/perencanaan/index.js
import React from 'react';
import { useSession } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import DashboardLayout from '../../components/DashboardLayout';
import PerencanaanContainer from '../../components/perencanaan/PerencanaanContainer';

export default function PerencanaanPage() {
  const { data: session, status } = useSession();

  return (
    <DashboardLayout>
      <PerencanaanContainer session={session} status={status} />
    </DashboardLayout>
  );
}

// Server-side protection
export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Halaman Perencanaan hanya untuk: katim, kabag_tu, admin_tambun_raya
  const allowedRoles = ['katim', 'kabag_tu', 'admin_tambun_raya'];
  const roles = [];
  if (session.user?.role) roles.push(session.user.role);
  if (Array.isArray(session.user?.roles)) roles.push(...session.user.roles);
  else if (typeof session.user?.roles === 'string') roles.push(...session.user.roles.split(','));

  const hasAccess = roles.some(r => allowedRoles.includes(String(r).trim().toLowerCase()));

  if (!hasAccess) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
