import { cn } from '@/lib/utils';
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element { return <div className={cn('rounded-xl border bg-white shadow-sm dark:bg-slate-900', className)} {...props} />; }
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element { return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />; }
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element { return <div className={cn('p-6 pt-0', className)} {...props} />; }
