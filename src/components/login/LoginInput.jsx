import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function LoginInput({label, iconName, isError, children, ...props}) {
    return (
        <View style={styles.container}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={[styles.inputWrapper, isError && styles.inputErrorBorder]}>
                <Feather name={iconName} size={18} color="#667085" style={styles.inputIcon} />
                <TextInput
                    style={styles.textInput}
                    placeholderTextColor="#98A2B3"
                    {...props}
                />
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 14,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#344054',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D0D5DD',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 48,
    },
    inputErrorBorder: {
        borderColor: '#D92D20',
        borderWidth: 1.5,
    },
    inputIcon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        color: '#1D2939',
        fontSize: 15,
    },
});
