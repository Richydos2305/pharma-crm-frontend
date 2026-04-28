import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { getMe } from '../../api/users';
import { queryKeys } from '../../api/queryKeys';

interface AppLayoutProps {
  children: ReactNode;
  mobileTopBar?: ReactNode;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AppLayout({ children, mobileTopBar }: AppLayoutProps) {
  const { data: user } = useQuery({ queryKey: queryKeys.me, queryFn: getMe, staleTime: Infinity, gcTime: Infinity });

  const companyName = user?.companyName ?? 'PharmaCRM';
  const companyInitials = companyName ? initials(companyName) : 'P';

  return (
    <>
      {mobileTopBar}
      <div className="app-layout">
        <Sidebar companyName={companyName} companyInitials={companyInitials} />
        <main className="main-area app-page">{children}</main>
      </div>
      <BottomNav />
    </>
  );
}
