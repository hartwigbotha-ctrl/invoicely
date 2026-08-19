import { requireBusiness } from "@/lib/session";
import { db } from "@/db";
import { items } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateItem } from "@/lib/actions/items";
import { ItemForm } from "../item-form";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { business } = await requireBusiness();

  const item = await db.query.items.findFirst({
    where: and(eq(items.id, id), eq(items.businessId, business.id)),
  });
  if (!item) notFound();

  const updateWithId = updateItem.bind(null, id);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Edit item</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ItemForm action={updateWithId} item={item} />
      </div>
    </div>
  );
}
