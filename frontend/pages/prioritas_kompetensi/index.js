// pages/prioritas_kompetensi/index.js
import React from 'react';
import { useSession, getSession } from 'next-auth/react';
import DashboardLayout from '../../components/DashboardLayout';
import PrioritasContainer from '../../components/prioritaskompetensi/PrioritasContainer';

export default function PrioritasKompetensiPage() {
  const { data: session } = useSession();

  return (
    <DashboardLayout>
      <PrioritasContainer session={session} />
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
