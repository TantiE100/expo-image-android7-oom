import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ImageCard } from './ImageCard';

type RailProps = {
  tab: string;
  row: number;
  count: number;
  cardWidth: number;
  cardHeight: number;
  sourceWidth: number;
  sourceHeight: number;
};

function Rail({ tab, row, count, cardWidth, cardHeight, sourceWidth, sourceHeight }: RailProps) {
  const data = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={styles.rail}>
      <Text style={styles.title}>{`${tab} rail ${row}`}</Text>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(i) => String(i)}
        removeClippedSubviews
        initialNumToRender={3}
        windowSize={3}
        maxToRenderPerBatch={3}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
        renderItem={({ item }) => (
          <ImageCard
            seed={`${tab}-${row}-${item}`}
            width={cardWidth}
            height={cardHeight}
            sourceWidth={sourceWidth}
            sourceHeight={sourceHeight}
          />
        )}
      />
    </View>
  );
}

type RailsScreenProps = {
  tab: string;
  rows: number;
  cardsPerRail: number;
  cardWidth: number;
  cardHeight: number;
  sourceWidth: number;
  sourceHeight: number;
};

export function RailsScreen({ tab, rows, ...rail }: RailsScreenProps) {
  const data = Array.from({ length: rows }, (_, i) => i);
  return (
    <FlatList
      testID={`${tab}-list`}
      style={styles.screen}
      data={data}
      keyExtractor={(i) => String(i)}
      removeClippedSubviews
      initialNumToRender={3}
      windowSize={5}
      renderItem={({ item }) => (
        <Rail
          tab={tab}
          row={item}
          count={rail.cardsPerRail}
          cardWidth={rail.cardWidth}
          cardHeight={rail.cardHeight}
          sourceWidth={rail.sourceWidth}
          sourceHeight={rail.sourceHeight}
        />
      )}
    />
  );
}

export function FeedScreen({ tab, rows }: { tab: string; rows: number }) {
  const data = Array.from({ length: rows }, (_, i) => i);
  return (
    <FlatList
      testID={`${tab}-list`}
      style={styles.screen}
      data={data}
      keyExtractor={(i) => String(i)}
      removeClippedSubviews
      initialNumToRender={4}
      windowSize={5}
      contentContainerStyle={styles.feedContent}
      renderItem={({ item }) => (
        <ImageCard
          seed={`${tab}-feed-${item}`}
          width={344}
          height={193}
          sourceWidth={768}
          sourceHeight={432}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  rail: { marginBottom: 16 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', margin: 12 },
  railContent: { paddingHorizontal: 12 },
  feedContent: { padding: 12 },
});
