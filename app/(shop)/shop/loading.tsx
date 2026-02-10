import { Package, Store, Star } from "lucide-react";
import { DistributorSkeleton } from "@/components/customer/DistributorSkeleton";

export default function ShopLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
                {/* Quick Summary Skeleton */}
                <section>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
                        <div className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
                    </div>
                </section>

                {/* Favorites Skeleton */}
                <section>
                    <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
                    <DistributorSkeleton />
                </section>

                {/* All Distributors Skeleton */}
                <section>
                    <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
                    <DistributorSkeleton />
                </section>
            </div>
        </div>
    );
}
