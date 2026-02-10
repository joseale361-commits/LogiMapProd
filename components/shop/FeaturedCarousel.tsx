'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

import { VariantItem } from '@/lib/queries/shop';

interface FeaturedCarouselProps {
    title: string;
    products: VariantItem[];
}

export function FeaturedCarousel({ title, products }: FeaturedCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        slidesToScroll: 1,
        containScroll: 'trimSnaps'
    });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (!products || products.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={scrollPrev} className="h-8 w-8 rounded-full">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={scrollNext} className="h-8 w-8 rounded-full">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden p-1 -m-1" ref={emblaRef}>
                <div className="flex touch-pan-y gap-4" style={{ backfaceVisibility: 'hidden' }}>
                    {products.map((product) => (
                        <div key={product.id} className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_45%] md:flex-[0_0_30%] lg:flex-[0_0_22%] pl-4 first:pl-0">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
