/*  app/products/[id]/page.tsx
    ─────────────────────────────────────────────── */

    import { Metadata } from "next";
    import ProductClientView from "./ProductClientView";
    import SiteHeader from "@/components/layout/SiteHeader";
    import SiteFooter from "@/components/layout/SiteFooter";
    
    /* ------------------------------------------------------------------ */
    /*                           API helper                               */
    /* ------------------------------------------------------------------ */
    const API_BASE = "https://rani-riwaaj-backend-ylbq.vercel.app/";
    
    /* ------------------------------------------------------------------ */
    /*                     <head>  dynamic metadata                       */
    /* ------------------------------------------------------------------ */
    export async function generateMetadata(
      { params }: { params: { id: string } }
    ): Promise<Metadata> {
      const res = await fetch(`https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${params.id}`, {
        cache: "no-store",
      });
      if (!res.ok) return {};
      const p: Product = await res.json();
      return {
        title: `${p.name} | Rani Riwaaj`,
        description: p.desc,
        openGraph: {
          images: [p.defaultImage?.url ?? "/placeholder.png"],
        },
      };
    }
    
    /* ------------------------------------------------------------------ */
    /*                               PAGE                                 */
    /* ------------------------------------------------------------------ */
    export default async function ProductPage({
      params,
    }: {
      params: { id: string };
    }) {
      const res = await fetch(`https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${params.id}`, {
        cache: "no-store",
      });
    
      /* graceful 404 --------------------------------------------------- */
      if (!res.ok) {
        return (
          <>
            <SiteHeader />
            <main style={{ padding: "2rem", textAlign: "center" }}>
              Product not found. <a href="/">Back&nbsp;to&nbsp;shop</a>
            </main>
            <SiteFooter />
          </>
        );
      }
    
      const product: Product = await res.json();
    
      /* flatten every image bucket into one array --------------------- */
      const gallery: GalleryImage[] = [
        ...(product.globalImages ?? []),
        ...(Object.values(product.imagesByColor ?? {}) as GalleryImage[][]).flat(),
      ];
    
      return (
        <>
          <SiteHeader />
    
          {/* 🚀 client component (stateful gallery, add-to-cart, etc.) */}
          <ProductClientView
            product={product}
            gallery={gallery.length ? gallery : [{ url: "/placeholder.png" }]}
          />
    
          <SiteFooter />
        </>
      );
    }
    
    /* ------------------------------------------------------------------ */
    /*                              TYPES                                 */
    /* ------------------------------------------------------------------ */
    export interface GalleryImage {
      url: string;
      publicId?: string;
    }
    
    interface Product {
      _id: string;
      name: string;
      desc: string;
      price: string;
      defaultImage?: { url: string; publicId: string };
      globalImages?: GalleryImage[];
      imagesByColor?: Record<string, GalleryImage[]>;
      colors?: string[];
      sizes?: string[];
      justIn?: boolean;
      /* …any other fields you store … */
    }
