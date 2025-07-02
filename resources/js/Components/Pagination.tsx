// resources/js/Components/Pagination.tsx
import { Link } from "@inertiajs/react";

export default function Pagination({ pagination }: { pagination: any }) {
    if (!pagination || pagination.total <= pagination.per_page) return null;

    return (
        <div className="flex justify-center mt-6">
            <div className="inline-flex items-center space-x-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg shadow-md">
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
                                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                                        : isDisabled
                                        ? "text-slate-500 cursor-not-allowed"
                                        : "text-white hover:bg-slate-700 hover:text-purple-300"
                                }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
