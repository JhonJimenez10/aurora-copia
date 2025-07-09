// resources/js/Components/Pagination.tsx
import { Link } from "@inertiajs/react";

export default function Pagination({ pagination }: { pagination: any }) {
    if (!pagination || pagination.total <= pagination.per_page) return null;

    return (
        <div className="flex justify-center mt-6">
            <div className="inline-flex items-center space-x-1 bg-black border border-red-700 px-2 py-1 rounded-lg shadow-md">
                {pagination.links.map((link: any, index: number) => {
                    const isActive = link.active;
                    const isDisabled = !link.url;

                    return (
                        <Link
                            key={index}
                            href={link.url ?? ""}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                                ${
                                    isActive
                                        ? "bg-gradient-to-r from-red-700 via-red-600 to-yellow-400 text-white shadow-sm"
                                        : isDisabled
                                        ? "text-red-400 cursor-not-allowed"
                                        : "text-white hover:bg-red-700 hover:text-white"
                                }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
