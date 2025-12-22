import { FontFamilies } from '@/src/styles/theme/typography';
import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, View, Text, ViewStyle } from 'react-native';

interface TextInputViewProps extends TextInputProps {
  error?: string;
  containerStyle?: ViewStyle;
}

const TextInputView = forwardRef<TextInput, TextInputViewProps>(
  ({ containerStyle = {}, style, error, ...props }, ref) => {
    return (
      <View style={containerStyle}>
        <TextInput
          ref={ref}

          style={[
            {
              fontFamily: FontFamilies.vazir.medium,
              borderWidth: 1,
              borderColor: error ? 'red' : 'gray',
              padding: 10,
              borderRadius: 5,
              fontSize: 16,
            },
            style,
          ]}
          {...props}
        />
        {error && <Text style={{ color: 'red', fontSize: 12 }}>{error}</Text>}
      </View>
    );
  }
);

export default TextInputView;
