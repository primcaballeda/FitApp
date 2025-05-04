import React from 'react';
import { Svg, Circle, Path } from 'react-native-svg';

const Logo = (props) => {
  return (
    <Svg
      width={props.width || 100}
      height={props.height || 100}
      viewBox="0 0 100 100"
      {...props}
    >
      <Circle cx="50" cy="50" r="45" fill="#E54D2E" />
      <Circle cx="50" cy="50" r="35" fill="#FFEE9C" />
      <Path
        d="M35 40 L35 60 M50 30 L50 70 M65 40 L65 60"
        stroke="#E54D2E"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default Logo;