# Phase 5: Product Data Management — التوثيق الكامل

**التاريخ**: 2026-02-19  
**آخر تحديث**: 2026-02-19  
**الحالة**: ✅ مكتمل (35 مهمة — T052 إلى T086) + تحسينات ما بعد المراجعة

---

## نظرة عامة

المرحلة الخامسة تركز على بناء نظام إدارة بيانات المنتجات بالكامل، من قاعدة البيانات (Payload Collections) إلى واجهة المتجر (Storefront Pages). تشمل:

- 5 مجموعات بيانات (Collections) في Payload CMS
- 3 خطافات (Hooks) قابلة لإعادة الاستخدام
- وحدة الكتالوج (Catalog Module) مع 3 خدمات
- ميزة المنتجات (Products Feature) مع 8 مكونات UI
- 5 ودجات (Widgets) — مع barrel files
- 8 صفحات واجهة متجر (Storefront Pages) — ملتزمة بالدستور

---

## 1. مجموعات البيانات (Payload Collections)

### 1.1 `brands.ts`
**المسار**: `src/payload/collections/brands.ts`

مجموعة الماركات/العلامات التجارية للمنتجات.

| الحقل | النوع | مطلوب | القيمة الافتراضية | الوصف |
|-------|------|-------|-----------------|-------|
| `name` | text | ✅ | — | اسم الماركة |
| `slug` | text | ✅ (unique, indexed) | — | المعرف في URL (يُنشأ تلقائياً) |
| `logo` | upload → media | — | — | شعار الماركة |
| `description` | textarea | — | — | وصف اختياري |
| `sort_order` | number | ✅ | 0 | ترتيب العرض |
| `is_active` | checkbox | ✅ | true | إخفاء من المتجر |

**الصلاحيات**: قراءة عامة، إنشاء/تعديل للمسؤولين، حذف لـ super-admin فقط  
**الخطافات**: `generateSlug` (beforeChange)، `revalidateCache` (afterChange)

---

### 1.2 `categories.ts`
**المسار**: `src/payload/collections/categories.ts`

مجموعة التصنيفات الهرمية (مستويين كحد أقصى: أب → ابن).

| الحقل | النوع | مطلوب | القيمة الافتراضية | الوصف |
|-------|------|-------|-----------------|-------|
| `name` | text | ✅ | — | اسم التصنيف |
| `slug` | text | ✅ (unique, indexed) | — | المعرف في URL |
| `image` | upload → media | — | — | صورة التصنيف |
| `parent` | relationship → categories | — | — | التصنيف الأب |
| `sort_order` | number | ✅ | 0 | ترتيب العرض |
| `is_active` | checkbox | ✅ | true | إخفاء من المتجر |

**الخطافات**: `generateSlug`، `validateParentDepth`، `revalidateCache`  
**القيود**: لا يمكن أن يكون التصنيف أباً لنفسه، الحد الأقصى مستويين

---

### 1.3 `products.ts`
**المسار**: `src/payload/collections/products.ts`

مجموعة المنتجات الأساسية مع علاقات الماركات والتصنيفات.

| الحقل | النوع | مطلوب | القيمة الافتراضية | الوصف |
|-------|------|-------|-----------------|-------|
| `name` | text | ✅ | — | اسم المنتج |
| `slug` | text | ✅ (unique, indexed) | — | المعرف في URL |
| `brand` | relationship → brands | — | — | الماركة |
| `categories` | relationship → categories (hasMany) | — | — | التصنيفات (Many-to-Many) |
| `description` | richText | — | — | وصف المنتج |
| `unit_label` | text | ✅ | 'Unit' | وحدة القياس |
| `image` | upload → media | — | — | صورة المنتج الرئيسية |
| `sort_order` | number | ✅ | 0 | ترتيب العرض |
| `is_active` | checkbox | ✅ | true | إخفاء من المتجر |

**الخطافات**: `generateSlug`، `revalidateCache`

---

### 1.4 `product-variants.ts`
**المسار**: `src/payload/collections/product-variants.ts`

متغيرات المنتج (نكهات، أحجام، إلخ). لكل متغير سعر ومخزون مستقل.

| الحقل | النوع | مطلوب | القيمة الافتراضية | الوصف |
|-------|------|-------|-----------------|-------|
| `product` | relationship → products | ✅ | — | المنتج الأب |
| `variant_name` | text | ✅ | — | اسم المتغير |
| `sku` | text | ✅ (unique, indexed) | — | رمز المخزون |
| `price` | number | ✅ (min: 0) | — | السعر بالدولار |
| `stock_quantity` | number | ✅ (min: 0) | 0 | كمية المخزون |
| `images` | **array** → [upload → media] | — | — | **مصفوفة صور** (أول صورة هي الرئيسية) |
| `option_value` | text | — | — | قيمة الفلتر |
| `sort_order` | number | ✅ | 0 | ترتيب العرض |
| `is_active` | checkbox | ✅ | true | إخفاء من المتجر |

> **تغيير مهم**: الحقل `image` (صورة واحدة) تم تغييره إلى `images` (مصفوفة صور) لدعم عدة صور لكل متغير.

**الخطافات**: `revalidateCache`

---

### 1.5 `media.ts`
**المسار**: `src/payload/collections/media.ts`

مجموعة رفع الملفات (صور فقط حالياً). تُخزن محلياً في `public/media`.

| الحقل | النوع | الوصف |
|-------|------|-------|
| `alt` | text | نص بديل للوصول |

**أحجام الصور المُنشأة تلقائياً**:

| الاسم | العرض | الارتفاع | الاستخدام |
|-------|------|---------|----------|
| thumbnail | 300px | 300px | شبكات صغيرة |
| card | 600px | 600px | بطاقات المنتجات |
| hero | 1200px | auto | صفحات التفاصيل |

**الأنواع المسموحة**: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`

---

## 2. الخطافات (Hooks)

### 2.1 `generate-slug.ts`
**المسار**: `src/payload/hooks/before-change/generate-slug.ts`  
**يُستخدم في**: Brands, Categories, Products

يُنشئ تلقائياً slug من حقل `name` عند الإنشاء أو عندما يكون slug فارغاً.

### 2.2 `validate-parent-depth.ts`
**المسار**: `src/payload/hooks/before-change/validate-parent-depth.ts`  
**يُستخدم في**: Categories

يفرض قاعدة أن التصنيفات لا تتجاوز مستويين (أب → ابن فقط).

### 2.3 `revalidate-cache.ts`
**المسار**: `src/payload/hooks/after-change/revalidate-cache.ts`  
**يُستخدم في**: Brands, Categories, Products, ProductVariants

يُبطل كاش ISR في Next.js عند تغيير بيانات الكتالوج.

---

## 3. وحدة الكتالوج (Catalog Module)

**المسار**: `src/modules/catalog/`

### 3.1 `types.ts`

| النوع | الوصف |
|-------|-------|
| `CatalogBrand` | بيانات الماركة للعرض |
| `CatalogCategory` | بيانات التصنيف مع الأبناء |
| `CatalogVariant` | بيانات المتغير مع **مصفوفة الصور** والسعر والمخزون |
| `CatalogProduct` | بيانات المنتج الكاملة مع المتغيرات |
| `ProductCardData` | بيانات مختصرة لبطاقة المنتج |
| `PaginatedResult<T>` | نتيجة مُقسمة |
| `ProductFilters` | فلاتر البحث |

> **تغيير مهم**: `CatalogVariant.imageUrl: string | null` تم تغييره إلى `images: string[]`

### 3.2 `product.service.ts`

| الدالة | الوصف |
|--------|-------|
| `getActiveProducts(params)` | جلب المنتجات النشطة مع التقسيم والفلاتر (بما فيها `brandSlug` و `categorySlug`) |
| `getProductBySlug(slug)` | جلب منتج واحد بالتفاصيل الكاملة |
| `getProductsByBrand(brandSlug)` | جلب منتجات ماركة محددة |
| `getProductsByCategory(categorySlug)` | جلب منتجات تصنيف محدد |

### 3.3 `category.service.ts`

| الدالة | الوصف |
|--------|-------|
| `getActiveCategories()` | جلب التصنيفات كشجرة (أب → أبناء) |
| `getCategoryBySlug(slug)` | جلب تصنيف واحد مع أبنائه |
| `getRootCategories()` | جلب التصنيفات الجذرية فقط |

### 3.4 `brand.service.ts`

| الدالة | الوصف |
|--------|-------|
| `getActiveBrands()` | جلب الماركات النشطة مرتبة |
| `getBrandBySlug(slug)` | جلب ماركة واحدة |
| `getBrandsByCategory(categorySlug)` | **[جديد]** جلب الماركات اللي لها منتجات في تصنيف محدد |

### 3.5 `README.md` — **[جديد]**
توثيق الموديول: الغرض، الخدمات، التبعيات، القواعد.

---

## 4. ميزة المنتجات (Products Feature)

**المسار**: `src/features/products/`

### 4.1 مكونات UI

#### `ProductCard.tsx` (Server Component)
بطاقة منتج تعرض: الصورة، اسم الماركة، اسم المنتج، نطاق السعر، عدد المتغيرات، حالة المخزون.
> **تحسين**: إضافة **شارة عدد المتغيرات** ("X Flavors") في الزاوية العلوية اليمنى لصورة المنتج.

#### `ProductDetail.tsx` (Client Component) — **مُعاد تصميمه**
عرض تفاصيل المنتج الكاملة مع:
- **عنوان ديناميكي**: `اسم المنتج - اسم المتغير` (مثل: Mello 20k - Sour Apple Icy)
- **معرض صور**: الصورة الرئيسية كبيرة + مربعات صغيرة للصور الإضافية
- **الضغط على صورة مصغرة** → تصبح الصورة الرئيسية
- **تغيير المتغير** → يعيد ضبط المعرض للصورة الأولى
- نص "Viewing: اسم المتغير" تحت المعرض

#### `VariantSelector.tsx` (Client Component) — **مُعاد تصميمه**
محدد متغيرات كبطاقات صفوف، كل صف يعرض:
- صورة مصغرة للمتغير (48px)
- الاسم والسعر وحالة المخزون
- شارة "Sold Out" حمراء للمتغيرات المنفذة
- علامة ✓ خضراء للمتغير المختار

#### `BrandCard.tsx` / `BrandGrid.tsx` (Server Components)
بطاقات وشبكة الماركات.

#### `CategoryCard.tsx` / `CategoryGrid.tsx` (Server Components)
بطاقات وشبكة التصنيفات.

#### `CategoryBrandFilter.tsx` (Server Component) — **[جديد]**
شبكة فلتر الماركات داخل صفحة التصنيف:
- يعرض الماركات كبطاقات صغيرة (3-6 أعمدة حسب الشاشة)
- الماركة المختارة بإطار أخضر
- رابط "← Show all brands" لإزالة الفلتر
- يستخدم `next/image` لشعارات الماركات

### 4.2 `index.ts` — **مُحدّث**
- يصدّر جميع مكونات UI (8 مكونات)
- **يعيد تصدير دوال وأنواع `modules/catalog`** حتى تستورد الصفحات من `@/features/products` فقط (التزام بالدستور)

---

## 5. الودجات (Widgets)

### 5.1 `Header` — `src/widgets/header/`
شريط تنقل ثابت (sticky) مع شعار وروابط.
> **[جديد]** ملف `index.ts` barrel.

### 5.2 `Footer` — `src/widgets/footer/`
تذييل بـ 4 أعمدة.
> **[جديد]** ملف `index.ts` barrel.

### 5.3 `ProductGrid` — `src/widgets/product-grid/`
شبكة منتجات استجابية (2-4 أعمدة) مع حالة فارغة.
> **[جديد]** ملف `index.ts` barrel.

### 5.4 `WhatsAppButton` — `src/widgets/whatsapp-button/`
زر واتساب عائم مع تأثيرات hover.
> **[جديد]** ملف `index.ts` barrel.

### 5.5 `HeroSection` — `src/widgets/hero/` — **[جديد]**
بانر ترحيب للصفحة الرئيسية بتدرج أخضر.
> **نُقل** من `features/products/ui/` إلى `widgets/hero/` لأنه لا ينتمي لميزة المنتجات معمارياً.

---

## 6. صفحات المتجر (Storefront Pages)

> **تحسين معماري**: جميع الصفحات تستورد فقط من `@/features/products` و `@/widgets/*` (لا تستورد من `@/modules/catalog` مباشرة).

### 6.1 `layout.tsx`
التخطيط الرئيسي: التحقق من الجلسة، Header + Footer + WhatsAppButton.

### 6.2 الصفحة الرئيسية
- ودجت `HeroSection` (من `@/widgets/hero`)
- شبكة الماركات + التصنيفات + أحدث المنتجات
- ISR: 60 ثانية

### 6.3 صفحة المنتجات
قائمة جميع المنتجات مع تقسيم الصفحات.

### 6.4 صفحة تفاصيل المنتج
`generateMetadata` لـ SEO + `ProductDetail` مع معرض الصور والمتغيرات.

### 6.5/6.6 صفحات الماركات
قائمة + تفاصيل مع منتجات الماركة.

### 6.7 صفحة التصنيفات
قائمة جميع التصنيفات الجذرية.

### 6.8 صفحة تفاصيل التصنيف — **مُعاد تصميمها**
تدفق جديد: **فئة → ماركات → منتجات**:
- عند الدخول لفئة: يعرض **شبكة الماركات المرتبطة** بالفئة
- عند اختيار ماركة: يُضاف `?brand=slug` ويعرض المنتجات تحت الماركات
- رابط "← Show all brands" لإزالة الفلتر
- مكون `CategoryBrandFilter` مسؤول عن عرض الماركات

---

## 7. إصلاحات الالتزام بالدستور

| المخالفة | الشدة | الإصلاح |
|----------|------|---------|
| V1: الصفحات تستورد من `modules/` | 🔴 حرج | أُضيفت re-exports في `features/products/index.ts` — الصفحات تستورد من `@/features/products` فقط |
| V2: تصميم UI داخل الصفحات | 🟠 عالي | استُخرج `CategoryBrandFilter` و `HeroSection` كمكونات منفصلة |
| V3: Deep imports من الودجات | 🟡 متوسط | أُضيفت barrel files (`index.ts`) لكل ودجت (5 ملفات) وحُدّثت كل الاستيرادات |
| V4: `<img>` بدل `next/image` | 🟡 منخفض | استُبدل بـ `<Image>` من `next/image` في `CategoryBrandFilter` |
| V5: `README.md` مفقود | 🟡 منخفض | أُضيف `src/modules/catalog/README.md` |

---

## 8. شجرة الملفات الكاملة

```
src/
├── payload/
│   ├── collections/
│   │   ├── brands.ts              # [جديد]
│   │   ├── categories.ts          # [جديد]
│   │   ├── products.ts            # [جديد]
│   │   ├── product-variants.ts    # [جديد] → images array
│   │   └── media.ts               # [جديد]
│   ├── hooks/
│   │   ├── before-change/
│   │   │   ├── generate-slug.ts
│   │   │   └── validate-parent-depth.ts
│   │   └── after-change/
│   │       └── revalidate-cache.ts
│   └── payload.config.ts          # [معدّل]
├── modules/
│   └── catalog/
│       ├── README.md              # [جديد] ← V5 fix
│       ├── types.ts               # [معدّل] images: string[]
│       ├── index.ts
│       └── services/
│           ├── product.service.ts # [معدّل] toVariant images array
│           ├── category.service.ts
│           └── brand.service.ts   # [معدّل] + getBrandsByCategory
├── features/
│   ├── _registry/index.ts         # [معدّل]
│   └── products/
│       ├── README.md
│       ├── feature.config.ts
│       ├── index.ts               # [معدّل] ← re-exports catalog + 8 components
│       ├── types.ts
│       ├── constants.ts
│       └── ui/
│           ├── ProductCard.tsx    # [معدّل] + variant count badge
│           ├── ProductDetail.tsx  # [مُعاد تصميم] + image gallery
│           ├── VariantSelector.tsx # [مُعاد تصميم] + card rows
│           ├── BrandCard.tsx
│           ├── BrandGrid.tsx
│           ├── CategoryCard.tsx
│           ├── CategoryGrid.tsx
│           └── CategoryBrandFilter.tsx # [جديد] ← V2 fix
├── widgets/
│   ├── header/
│   │   ├── Header.tsx
│   │   └── index.ts              # [جديد] ← V3 fix
│   ├── footer/
│   │   ├── Footer.tsx
│   │   └── index.ts              # [جديد]
│   ├── product-grid/
│   │   ├── ProductGrid.tsx
│   │   └── index.ts              # [جديد]
│   ├── whatsapp-button/
│   │   ├── WhatsAppButton.tsx
│   │   └── index.ts              # [جديد]
│   └── hero/                     # [جديد] ← نُقل من features/
│       ├── HeroSection.tsx
│       └── index.ts
├── app/
│   ├── gate/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── (storefront)/
│       ├── layout.tsx             # [معدّل] barrel widget imports
│       ├── page.tsx               # [معدّل] features/ imports + HeroSection widget
│       ├── products/
│       │   ├── page.tsx           # [معدّل] features/ imports
│       │   └── [slug]/page.tsx    # [معدّل] features/ imports
│       ├── brands/
│       │   ├── page.tsx           # [معدّل] features/ imports
│       │   └── [slug]/page.tsx    # [معدّل] features/ imports
│       └── categories/
│           ├── page.tsx           # [معدّل] features/ imports
│           └── [slug]/page.tsx    # [مُعاد تصميم] brand filter flow
└── next.config.ts
```

---

## 9. القرارات التقنية المهمة

| القرار | السبب |
|--------|-------|
| تخزين الوسائط محلياً (`public/media`) | Cloudinary مؤجل للمرحلة 6+ |
| إزالة `typedRoutes: true` | غير متوافق مع المسارات الديناميكية أثناء التطوير |
| إبطال الكاش عبر Tags | تحكم دقيق في ISR بدل إعادة بناء كل شيء |
| `ProductDetail` كـ Client Component | يحتاج إدارة حالة اختيار المتغير والمعرض |
| نقل `/gate` خارج `(storefront)` | منع حلقة إعادة توجيه لانهائية |
| `overrideAccess: true` في الخدمات | البيانات عامة للقراءة — التحقق يتم في layout |
| Re-export catalog عبر features/ | الصفحات لا تستورد من modules/ مباشرة (دستور FSD) |
| Images array بدل image واحد | دعم عدة صور لكل متغير منتج |
| HeroSection كـ widget | ليس مرتبطاً بميزة المنتجات معمارياً |
| Brand filter بـ query param | تنقل أسرع بدون تحميل صفحة جديدة |

---

## 10. نتائج الفحص

- ✅ **TypeScript**: 0 أخطاء (`npx tsc --noEmit`)
- ✅ **Build**: `npm run build` ناجح
- ✅ **المتصفح**: جميع الصفحات تعمل بدون أخطاء 404
- ✅ **بنية FSD**: مطابقة للدستور (features → modules → core)
- ✅ **أمان**: DAL pattern مطبق، session verification في layout
- ✅ **SEO**: `generateMetadata` في صفحات التفاصيل، ISR مُفعّل
- ✅ **الدستور**: 5 مخالفات تم إصلاحها (V1–V5)
