import {
  FileText,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/db';
import { details, categories, failureCases, warningConditions, detailSteps, substrates } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

async function getAdminStats() {
  const [detailCount] = await db.select({ count: count() }).from(details);
  const [categoryCount] = await db.select({ count: count() }).from(categories);
  const [failureCount] = await db.select({ count: count() }).from(failureCases);
  const [warningCount] = await db.select({ count: count() }).from(warningConditions);
  const [stepCount] = await db.select({ count: count() }).from(detailSteps);
  const [substrateCount] = await db.select({ count: count() }).from(substrates);

  return {
    details: Number(detailCount?.count) || 0,
    categories: Number(categoryCount?.count) || 0,
    failures: Number(failureCount?.count) || 0,
    warnings: Number(warningCount?.count) || 0,
    steps: Number(stepCount?.count) || 0,
    substrates: Number(substrateCount?.count) || 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const statCards = [
    {
      title: 'Total Details',
      value: stats.details,
      icon: FileText,
      href: '/admin/details',
      color: 'bg-blue-500',
    },
    {
      title: 'Categories',
      value: stats.categories,
      icon: Layers,
      href: '/admin/categories',
      color: 'bg-green-500',
    },
    {
      title: 'Case Law',
      value: stats.failures,
      icon: AlertTriangle,
      href: '/admin/failures',
      color: 'bg-red-500',
    },
    {
      title: 'Warnings',
      value: stats.warnings,
      icon: Clock,
      href: '/admin/details',
      color: 'bg-amber-500',
    },
    {
      title: 'Installation Steps',
      value: stats.steps,
      icon: CheckCircle,
      href: '/admin/details',
      color: 'bg-purple-500',
    },
    {
      title: 'Substrates',
      value: stats.substrates,
      icon: TrendingUp,
      href: '/admin/categories',
      color: 'bg-slate-500',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Manage MRM Code of Practice content</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.color} p-2 rounded-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for managing content</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/details/new">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Add New Detail
            </Button>
          </Link>
          <Link href="/admin/failures/new">
            <Button variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Add Case Law
            </Button>
          </Link>
          <Link href="/admin/export">
            <Button variant="outline">
              Export Data
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Content Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Content by Substrate</CardTitle>
            <CardDescription>Details distributed across substrates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              View and manage details organized by substrate type in the Details section.
            </p>
            <Link href="/admin/details" className="mt-4 inline-block">
              <Button variant="link" className="px-0">
                View All Details →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Law Tracking</CardTitle>
            <CardDescription>MBIE Determinations & LBP decision references</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Link case law to relevant details to provide cautionary information to users.
            </p>
            <Link href="/admin/failures" className="mt-4 inline-block">
              <Button variant="link" className="px-0">
                Manage Case Law →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
