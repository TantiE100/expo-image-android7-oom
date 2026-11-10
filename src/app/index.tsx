import { RailsScreen } from '@/components/Rails';

export default function Home() {
  return (
    <RailsScreen tab="home" rows={14} cardsPerRail={16} cardWidth={225} cardHeight={128} sourceWidth={450} sourceHeight={255} />
  );
}
