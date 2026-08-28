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

  return {
    props: { session },
  };
}
