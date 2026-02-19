// pages/standar_kompetensi/index.js
import React from 'react';
import { useSession } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import DashboardLayout from '../../components/DashboardLayout';
import PegawaiContainer from '../../components/pegawai/PegawaiContainer';

export default function PegawaiPage() {
  const { data: session, status } = useSession();

  return (
    <DashboardLayout>
      <PegawaiContainer session={session} status={status} />
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