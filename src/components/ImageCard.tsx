import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = { seed: string; width: number; height: number; sourceWidth: number; sourceHeight: number };

function ImageCardBase({ seed, width, height, sourceWidth, sourceHeight }: Props) {
  const uri = `https://picsum.photos/seed/${seed}/${sourceWidth}/${sourceHeight}.jpg`;
  return (
    <View style={[styles.card, { width, height }]}>
      <Image source={{ uri }} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
    </View>
  );
}

export const ImageCard = memo(ImageCardBase);

const styles = StyleSheet.create({
  card: { marginRight: 12, borderRadius: 8, overflow: 'hidden', backgroundColor: '#222' },
  image: { width: '100%', height: '100%' },
});
