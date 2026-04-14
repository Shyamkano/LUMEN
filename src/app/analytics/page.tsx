import { GrowthCenter } from '@/components/analytics/GrowthCenter';

export default function GlobalAnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
      <GrowthCenter isOverall={true} />
    </div>
  );
}
