'use client';

import { Loader2, MapPin } from 'lucide-react';

export default function RouteLoading() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <div className="h-9 w-9 bg-gray-100 animate-pulse rounded-lg" />
                    <div className="flex-1">
                        <div className="h-5 bg-gray-100 animate-pulse rounded w-32 mb-2" />
                        <div className="h-4 bg-gray-100 animate-pulse rounded w-20" />
                    </div>
                </div>
            </header>

            {/* Progress bar skeleton */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between text-sm mb-2">
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-16" />
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-8" />
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-1/3 animate-pulse" />
                </div>
            </div>

            {/* Map skeleton */}
            <div className="sticky top-[88px] z-10 bg-gray-100 border-b border-gray-200 h-[40vh] flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2 animate-pulse" />
                    <p className="text-gray-400">Cargando mapa...</p>
                </div>
            </div>

            {/* Stops skeleton */}
            <main className="px-4 py-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="h-8 w-8 bg-gray-100 rounded-full" />
                            <div className="flex-1">
                                <div className="h-5 bg-gray-100 rounded w-40 mb-2" />
                                <div className="h-4 bg-gray-100 rounded w-24" />
                            </div>
                        </div>
                        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                    </div>
                ))}
            </main>

            {/* Loading indicator */}
            <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Cargando...</span>
            </div>
        </div>
    );
}
