import Link from "next/link";
import { MentorWithDetails, getMentorInitials, formatHourlyRate } from "@/lib/mentorHelpers";

interface CoachCardProps {
  mentor: MentorWithDetails;
}

export default function CoachCard({ mentor }: CoachCardProps) {
  const initials = getMentorInitials(mentor.full_name);
  const hourlyRate = formatHourlyRate(mentor.mentor_data?.price_cents);
  const rating = 0; // Will be implemented later
  const reviewCount = 0; // Will be implemented later
  
  // Use short_description from mentor_data, fallback to bio
  const shortDescription = mentor.mentor_data?.short_description || mentor.bio;
  
  // Use specialties from mentor_data, fallback to focus_areas
  const specialties = mentor.mentor_data?.specialties || mentor.mentor_data?.focus_areas || [];

  return (
    <div className="group flex flex-col bg-[#ffffff] dark:bg-[#1F2937] rounded-xl border border-[#E2E8F0] dark:border-[#374151] p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#0ea5e9]">
      <div className="flex items-center gap-4 mb-4">
        {mentor.avatar_url ? (
          <img
            src={mentor.avatar_url}
            alt={mentor.full_name || "Coach"}
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-16 object-cover"
          />
        ) : (
          <div className="bg-gradient-to-br from-[#0ea5e9]/20 to-[#8b5cf6]/20 rounded-full size-16 flex items-center justify-center text-lg font-bold text-[#0ea5e9]">
            {initials}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-lg">{mentor.full_name || "Anonymous Coach"}</h3>
          {(mentor.mentor_data?.current_title || mentor.mentor_data?.current_company) && (
            <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] mt-0.5">
              {mentor.mentor_data?.current_title}
              {mentor.mentor_data?.current_title && mentor.mentor_data?.current_company && " at "}
              {mentor.mentor_data?.current_company}
            </p>
          )}
        </div>
      </div>
      
      {shortDescription && (
        <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] mb-4 line-clamp-2">
          {shortDescription}
        </p>
      )}
      
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {specialties.slice(0, 3).map((specialty, i) => (
            <span
              key={i}
              className="text-xs font-medium bg-sky-100/80 dark:bg-sky-900/40 text-[#0ea5e9] px-2.5 py-1 rounded-full capitalize"
            >
              {specialty}
            </span>
          ))}
        </div>
      )}
      
      <div className="mt-auto flex justify-between items-center">
        <p className="text-lg font-bold">
          {hourlyRate}
          {mentor.mentor_data?.price_cents && (
            <span className="text-sm font-normal text-[#64748B] dark:text-[#9CA3AF]">/hr</span>
          )}
        </p>
        <Link
          href={`/coaches/${mentor.id}`}
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0ea5e9] text-white text-sm font-bold leading-normal transition-opacity hover:opacity-90"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
