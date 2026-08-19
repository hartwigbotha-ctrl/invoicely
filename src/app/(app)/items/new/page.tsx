import { createItem } from "@/lib/actions/items";
import { ItemForm } from "../item-form";

export default function NewItemPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">New item</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ItemForm action={createItem} />
      </div>
    </div>
  );
}
