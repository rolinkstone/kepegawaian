// pages/pegawai/peran.js
import React from 'react';
import { useSession } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import DashboardLayout from '../../components/DashboardLayout';
import PeranPemenuhanContainer from '../../components/pegawai/PeranPemenuhanContainer';

export default function PegawaiPeranPage() {
  const { data: session, status } = useSession();

  return (
    <DashboardLayout>
      <PeranPemenuhanContainer session={session} status={status} />
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

  return {
    props: { session },
  };
}
