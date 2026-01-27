import Link from 'next/link';
import { Layers, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { substrates, categories, details } from '@/lib/db/schema';
import { eq, asc, count } from 'drizzle-orm';

async function getSubstratesWithCategories() {
  const allSubstrates = await db
    .select()
    .from(substrates)
    .orderBy(asc(substrates.sortOrder));

  const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));

  const substratesWithCategories = await Promise.all(
    allSubstrates.map(async (substrate) => {
      const substrateCats = allCategories.filter(
        (c) => c.substrateId === substrate.id
      );

      const categoriesWithCounts = await Promise.all(
        substrateCats.map(async (cat) => {
          const [countResult] = await db
            .select({ count: count() })
            .from(details)
            .where(eq(details.categoryId, cat.id));

          return {
            ...cat,
            detailCount: Number(countResult?.count) || 0,
          };
        })
      );

      return {
        ...substrate,
        categories: categoriesWithCounts,
      };
    })
  );

  return substratesWithCategories;
}

export default async function CategoriesPage() {
  const substratesWithCategories = await getSubstratesWithCategories();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <p className="text-slate-600">
          Manage categories organized by substrate type
        </p>
      </div>

      <div className="space-y-6">
        {substratesWithCategories.map((substrate) => (
          <Card key={substrate.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-slate-500" />
                {substrate.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {substrate.categories.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No categories for this substrate.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {substrate.categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-slate-500">
                          {category.description || 'No description'}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {category.detailCount} detail{category.detailCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <Link href={`/admin/categories/${category.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
