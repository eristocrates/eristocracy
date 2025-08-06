# 🔍 What `src/lib/` _is for_ in Astro

- ✅ It **is** a conventionally accepted folder for **shared modules** (not special like `pages/` or `layouts/`)
- ✅ Astro will correctly **resolve `import` statements** from `src/lib/...` into bundled modules **during build**
- ❌ Astro does **not** expose files in `src/lib/` to the **browser by URL** unless they are explicitly imported and bundled

---

### 🔥 Your Core Mistake (Runtime Import vs. Static Build)

You're doing something like:

```html
<script
  type="module"
  src="/src/lib/semantic/SemanticGraphViewerInit.js"
></script>
```

This **tries to fetch that file at runtime** from the built site (`dist/`) over HTTP.

🚫 But Astro does not copy that file to `dist/`

🚫 And the browser cannot import from `/src/...` unless it was explicitly emitted.

So the server responds with a fallback HTML file (likely 404.html or index.html), which triggers:

```
NS_ERROR_CORRUPTED_CONTENT
disallowed MIME type (“text/html”)
```

---

## ✅ When `src/lib/` Works

This **is valid** in Astro:

```ts
// Somewhere in a component or Astro page
import SemanticGraphViewerInit from "../lib/semantic/SemanticGraphViewerInit.js";
```

That’s because Astro (via Vite) will bundle and resolve it properly **during build time** .

So:

| Usage Type                                            | Is `src/lib/`valid? | Notes                  |
| ----------------------------------------------------- | ------------------- | ---------------------- |
| `import ... from 'src/lib/...';`(in `.astro`or `.js`) | ✅ yes              | Will be bundled        |
| `<script type="module" src="/src/lib/...">`           | ❌ no               | Will 404 in production |

---

## ✅ What to Do Instead

### Option 1: **Bundle via Import**

If you're using that JS module in an `.astro` file:

```astro
<script type="module">
  import SemanticGraphViewerInit from '../lib/semantic/SemanticGraphViewerInit.js';
  SemanticGraphViewerInit();
</script>
```

✅ This works because Astro will trace and bundle the import.

---

### Option 2: **Move to `/public/` if You Need Script Tag Loading**

If you must use:

```html
<script type="module" src="/semantic/SemanticGraphViewerInit.js"></script>
```

Then your directory must look like:

```
public/
  semantic/
    SemanticGraphViewerInit.js
```

✅ Files in `/public/` are **served as-is** and can be imported via `<script src="...">`.

---

## 🧠 Summary

| Scenario                      | Should Use              | Why                                   |
| ----------------------------- | ----------------------- | ------------------------------------- |
| Component wants shared logic  | `src/lib/`+`import ...` | Bundled properly                      |
| Runtime `<script>`inclusion   | `public/`               | Browser-accessible path               |
| Manual file URL in production | `public/`               | Only `public/`is preserved at runtime |

---

## ⚠️ TL;DR

> **`src/lib/` is for modules you want to import at build time**
>
> **`public/` is for modules you want to access at runtime via URL**
