import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FONT, SHADOW } from '../utils/theme';

const Logo = ({ size = 'md', showText = true }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const boxSize = isSm ? 32 : isLg ? 64 : 44;
  const fontSize = isSm ? 16 : isLg ? 32 : 24;
  const radius = Math.round(boxSize * 0.06);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo.png')} 
        style={[
          styles.logoImage, 
          { width: boxSize, height: boxSize }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    // Menghapus shadow karena logo sudah punya shadow bawaan di gambarnya
  },
  text: {
    ...FONT.black,
    color: '#1E1E1E',
    letterSpacing: -0.5,
  },
});

export default Logo;
