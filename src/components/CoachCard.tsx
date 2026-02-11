import Link from "next/link";
import { MentorWithDetails } from "@/types/mentor";
import { getMentorInitials } from "@/lib/mentorUtils";
import BookmarkButton from "./BookmarkButton";

interface CoachCardProps {
  mentor: MentorWithDetails;
}

export default function CoachCard({ mentor }: CoachCardProps) {
  const initials = getMentorInitials(mentor.full_name);
  const displayName = mentor.full_name || 'Anonymous Coach';
  const displayTitle = mentor.mentor_data?.current_title || 'Product Manager';
  const displayCompany = mentor.mentor_data?.current_company || '';
  
  // Use focus_areas from mentor_data for the pills under the coach's name
  const focusAreas = mentor.mentor_data?.focus_areas?.slice(0, 3) || [];
  const displayTags = focusAreas;

  // Use pricing_model and price_cents to determine pricing display
  const priceCents = mentor.mentor_data?.price_cents;
  const pricingModel = mentor.mentor_data?.pricing_model || 'free';
  
  // Determine pricing display - pricing_model is the source of truth
  const isFree = pricingModel === 'free';
  const isBoth = pricingModel === 'both' && priceCents && priceCents > 0;
  const isPaid = pricingModel === 'paid' && priceCents && priceCents > 0;
  const paidPrice = priceCents ? `$${(priceCents / 100).toFixed(0)}` : null;
  const displayPrice = isBoth 
    ? `FREE + ${paidPrice}` 
    : isFree 
      ? 'FREE' 
      : `${paidPrice}/session`;

  // Calculate "hired X months ago" from created_at or hired_date
  const getHiredTimeAgo = () => {
    const hiredDate = mentor.mentor_data?.hired_date;
    const createdAt = mentor.mentor_data?.created_at;
    const dateToUse = hiredDate || createdAt;
    if (!dateToUse) return 'Hired recently';
    
    const created = new Date(dateToUse);
    const now = new Date();
    const diffMonths = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (diffMonths < 1) return 'Hired recently';
    if (diffMonths === 1) return 'Hired 1 month ago';
    if (diffMonths < 12) return `Hired ${diffMonths} months ago`;
    const years = Math.floor(diffMonths / 12);
    return years === 1 ? 'Hired 1 year ago' : `Hired ${years} years ago`;
  };

  const hiredTimeAgo = getHiredTimeAgo();
  const avatarUrl = mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&size=128`;

  return (
    <Link 
      href={`/coaches/${mentor.id}`}
      className="group flex flex-col bg-white dark:bg-[#16242c] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-[#0ea5e9]/50 transition-all duration-300 relative"
    >
      <div className="absolute top-3 right-3 z-10">
        <BookmarkButton mentorId={mentor.id} size="sm" variant="card" />
      </div>
      
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4 pr-8">
          <div className="relative">
            {mentor.avatar_url ? (
              <img 
                className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-[#16242c] shadow-md" 
                alt={`Portrait of ${displayName}`} 
                src={avatarUrl}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center text-white text-lg font-bold border-2 border-white dark:border-[#16242c] shadow-md">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#333333] dark:text-white group-hover:text-[#0ea5e9] transition-colors truncate">{displayName}</h3>
            <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 truncate">
              {displayTitle}{displayCompany && ` @ ${displayCompany}`}
            </p>
            <p className="text-xs text-[#333333]/50 dark:text-[#F5F5F5]/50 mt-1">{hiredTimeAgo}</p>
          </div>
        </div>

        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {displayTags.map((tag, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md border border-blue-100 dark:border-blue-800">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
          {isBoth ? (
            <div className="flex gap-1.5">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                FREE
              </span>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                {paidPrice}
              </span>
            </div>
          ) : (
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              isFree 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            }`}>
              {displayPrice}
            </span>
          )}
          <span className="text-sm font-semibold text-[#0ea5e9] group-hover:underline">
            {isBoth ? 'View Options →' : isFree ? 'Book Free →' : 'Book Session →'}
          </span>
        </div>
      </div>
    </Link>
  );
}
