# MongoDB Atlas Automated Embedding Setup

Vibe Mall product search must use MongoDB Atlas Vector Search with Automated Embedding. The application must not generate embeddings, store application-created vectors, or call Voyage directly.

Atlas owns both embedding phases:

- Index time: Atlas embeds `products.searchText` with `voyage-4`.
- Query time: Atlas embeds the shopper's text vibe with a compatible model.

## Driver/Script Index Descriptor

Create this Atlas Vector Search index on the `products` collection.

Index name:

```text
product_vibe_autoembed
```

Index definition:

```json
{
  "name": "product_vibe_autoembed",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "autoEmbed",
        "modality": "text",
        "path": "searchText",
        "model": "voyage-4"
      },
      {
        "type": "filter",
        "path": "active"
      },
      {
        "type": "filter",
        "path": "category"
      }
    ]
  }
}
```

`npm run seed` writes the demo catalog and then creates or verifies this index.
To run only the index setup, use:

```bash
npm run create-index
```

Both commands use the documented MongoDB Node driver flow:

1. Call `collection.createSearchIndex(index)`.
2. Poll `collection.listSearchIndexes(index.name)` until `queryable` is `true`.

The polling timeout defaults to 5 minutes. Override it only when needed:

```bash
ATLAS_INDEX_TIMEOUT_MS=600000 npm run create-index
```

## Atlas UI JSON Editor Definition

If creating the index manually in Atlas, set the name to
`product_vibe_autoembed`, choose the `products` collection, and paste the
definition body:

```json
{
  "fields": [
    {
      "type": "autoEmbed",
      "modality": "text",
      "path": "searchText",
      "model": "voyage-4"
    },
    {
      "type": "filter",
      "path": "active"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}
```

## Manual Atlas UI Steps

1. Open the Atlas project and cluster.
2. Go to Search & Vector Search.
3. Create a new Vector Search index.
4. Choose JSON Editor.
5. Select the Vibe Mall database from `MONGODB_DB`.
6. Select the `products` collection.
7. Name the index `product_vibe_autoembed`.
8. Paste the Atlas UI definition body above.
9. Create the index and wait for Atlas to finish building it.

## Automated Embedding Cluster Prerequisites

Automated Embedding has an Atlas scaling prerequisite that is separate from the
index JSON and separate from normal Vector Search support.

For dedicated clusters:

- Enable storage auto-scaling.
- Enable cluster tier auto-scaling.
- If the current tier is M10 or M20, set the maximum instance size to M30 or
  higher.
- If the current tier is M30 or higher, set the maximum instance size higher than
  the current tier.

If Atlas returns an error like `requires Compute Auto-Scale to be at least M30`,
fix the cluster auto-scaling settings first, then rerun `npm run seed`. Use
`npm run create-index` only when you want to repair or recreate the index without
reseeding data. Creating the same JSON manually in the Atlas UI will fail until
the scaling prerequisite is satisfied.

## Expected Query Shape

Application code should query with text, not `queryVector`.

```ts
[
  {
    $vectorSearch: {
      index: "product_vibe_autoembed",
      path: "searchText",
      query: {
        text: "Y2K cyber-glam birthday"
      },
      model: "voyage-4",
      filter: {
        active: true
      },
      numCandidates: 160,
      limit: 8
    }
  },
  {
    $project: {
      sku: 1,
      name: 1,
      brand: 1,
      category: 1,
      price: 1,
      palette: 1,
      imageDataUri: 1,
      tags: 1,
      searchText: 1,
      vectorSearchScore: {
        $meta: "vectorSearchScore"
      }
    }
  }
]
```

No application code should include `queryVector`, vector dimensions, or a Voyage SDK/API call. Atlas Automated Embedding performs the query embedding.

## Troubleshooting

Missing index:

- Symptom: `$vectorSearch` fails with an index-not-found message.
- Fix: create `product_vibe_autoembed` on `products` using the JSON above.

Missing Voyage integration or Automated Embedding access:

- Symptom: Atlas rejects the `autoEmbed` field or cannot build embeddings.
- Fix: enable Automated Embedding / Voyage model access in Atlas, then rebuild the index.

Unsupported cluster or capability:

- Symptom: `createSearchIndex` fails from the script, or the Atlas UI does not offer Automated Embedding.
- Fix: confirm the MongoDB version and Atlas project support Atlas Vector Search with Automated Embedding. If the message mentions Compute Auto-Scale or M30, update the cluster auto-scaling settings above before retrying. If driver creation fails but the UI supports it and scaling is configured, create the index manually with the UI definition above.

Documents not returning:

- Confirm `npm run seed` has inserted active products.
- Confirm `products.searchText` is populated.
- Confirm the index build has completed.
- Confirm the query uses `query.text` and `model: "voyage-4"`, not `queryVector`.

## References

- MongoDB Automated Embedding overview: https://www.mongodb.com/docs/vector-search/crud-embeddings/automated-embedding/
- MongoDB Node.js driver Search index management: https://www.mongodb.com/docs/drivers/node/current/indexes/
