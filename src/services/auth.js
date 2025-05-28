// src/services/auth.js
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export const signInWithApple = async () => {
    try {
        const result = await FirebaseAuthentication.signInWithApple();
        if (!result.user) {
            throw new Error('Sign in with Apple failed: No user returned');
        }
        return result.user;
    } catch (error) {
        console.error('Sign in with Apple error:', error);
        throw error; // Re-throw to handle in the calling component
    }
};
export const signInWithGoogle = async () => {
    try {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (!result.user) {
            throw new Error('Sign in with Apple failed: No user returned');
        }
        return result.user;
    } catch (error) {
        console.error('Sign in with Apple error:', error);
        throw error; // Re-throw to handle in the calling component
    }
};

export const signOut = async () => {
    await FirebaseAuthentication.signOut();
};

export const getCurrentUser = async () => {
    const result = await FirebaseAuthentication.getCurrentUser();
    return result.user;
};

export const listenAuthState = (callback) => {
    FirebaseAuthentication.addListener('authStateChange', (result) => {
        callback(result.user);
    });
};