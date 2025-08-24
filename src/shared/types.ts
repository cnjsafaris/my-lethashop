import z from "zod";

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parent_id: z.number().nullable(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  compare_at_price: z.number().nullable(),
  sku: z.string().nullable(),
  inventory_quantity: z.number(),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  category_id: z.number().nullable(),
  image_url: z.string().nullable(),
  gallery_images: z.string().nullable(),
  materials: z.string().nullable(),
  care_instructions: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  category_name: z.string().nullable().optional(),
});

export const CartItemSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  product_id: z.number(),
  quantity: z.number(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  product_name: z.string().optional(),
  price: z.number().optional(),
  image_url: z.string().nullable().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
export type Product = z.infer<typeof ProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
