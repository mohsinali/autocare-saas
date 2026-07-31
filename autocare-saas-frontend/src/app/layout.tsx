import type { Metadata } from 'next'; import './globals.css'; import { AppProviders } from '@/providers/app-providers';
export const metadata: Metadata = { title: { default: 'AutoCare Services', template: '%s | AutoCare' }, description: 'Service operations, in one place.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element { return <html lang="en" suppressHydrationWarning><body><AppProviders>{children}</AppProviders></body></html>; }
