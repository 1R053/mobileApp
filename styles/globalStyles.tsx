import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create(
    {
        profileNotCompletedContainer: {
            flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 25, paddingRight: 25, paddingTop: 25
        },
        profileNotCompletedText: {
            fontSize: 14, fontWeight: '600', marginBottom: 12
        },
        profileNotCompletedButton: {
            padding: 8, backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8
        },
        fontWeight500: {
            fontWeight: '500'
        }
    }
);
