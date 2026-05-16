import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW } from '../utils/theme';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const boxSize = isSm ? 32 : isLg ? 64 : 44;
  const innerSize = isSm ? 18 : isLg ? 36 : 24;
  const fontSize = isSm ? 16 : isLg ? 32 : 24;

  return (
    <View style={styles.container}>
      {/* Official Box Icon */}
      <View style={[
        styles.box, 
        { width: boxSize, height: boxSize, borderRadius: isSm ? 8 : 12 }
      ]}>
        <View style={[
          styles.innerBox, 
          { width: innerSize, height: innerSize, borderRadius: isSm ? 4 : 6 }
        ]} />
      </View>

      {showText && (
        <Text style={[
          styles.text, 
          { fontSize: fontSize, marginLeft: isSm ? 8 : 12 }
        ]}>
          AgendaKu
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  innerBox: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  text: {
    ...FONT.black,
    color: '#1E1E1E',
    letterSpacing: -0.5,
  },
});

export default Logo;
