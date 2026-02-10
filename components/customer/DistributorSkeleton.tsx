import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "../ui/skeleton"

export function DistributorSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <Skeleton className="w-20 h-20 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                            <div className="flex flex-col w-full gap-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
