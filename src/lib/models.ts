import { ObjectId } from "mongodb";
import { z } from "zod";

export const productCategorySchema = z.enum([
  "apparel",
  "accessories",
  "home",
  "beauty",
  "gadgets",
  "snacks",
  "gifting"
]);

export const storefrontStatusSchema = z.enum(["draft", "published"]);

export const productSnapshotSchema = z.object({
  _id: z.instanceof(ObjectId),
  sku: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: productCategorySchema,
  price: z.number().nonnegative(),
  palette: z.array(z.string().min(1)).min(1),
  imageDataUri: z.string().startsWith("data:image/svg+xml"),
  tags: z.array(z.string().min(1)),
  searchText: z.string().min(1)
});

export const userSchema = z.object({
  _id: z.instanceof(ObjectId),
  email: z.email(),
  name: z.string().min(1),
  passwordHash: z.string().min(1),
  createdAt: z.date()
});

export const productSchema = productSnapshotSchema.extend({
  active: z.boolean(),
  createdAt: z.date()
});

export const storefrontSchema = z.object({
  _id: z.instanceof(ObjectId),
  ownerId: z.instanceof(ObjectId),
  vibe: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  productIds: z.array(z.instanceof(ObjectId)),
  productsSnapshot: z.array(productSnapshotSchema),
  generatedHtml: z.string(),
  codexThreadId: z.string().optional(),
  status: storefrontStatusSchema,
  createdAt: z.date(),
  publishedAt: z.date().optional()
});

export type ProductCategory = z.infer<typeof productCategorySchema>;
export type StorefrontStatus = z.infer<typeof storefrontStatusSchema>;
export type ProductSnapshot = z.infer<typeof productSnapshotSchema>;
export type User = z.infer<typeof userSchema>;
export type Product = z.infer<typeof productSchema>;
export type Storefront = z.infer<typeof storefrontSchema>;
