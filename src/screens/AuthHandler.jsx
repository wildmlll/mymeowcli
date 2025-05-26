import { useEffect, useState } from 'react';
import { signInWithApple, getCurrentUser } from '../services/auth';
import NicknameSelection from './NicknameSelection';
import LoadingScreen from './LoadingScreen';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function AuthHandler({ setScreen }) {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [isCheckingNickname, setIsCheckingNickname] = useState(true);
    const [hasNickname, setHasNickname] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Initialize required fields if they don't exist
                        const updates = {};
                        if (!userData.friends) updates.friends = [];
                        if (!userData.friendRequestsSent) updates.friendRequestsSent = [];
                        if (!userData.friendRequestsReceived) updates.friendRequestsReceived = [];
                        if (Object.keys(updates).length > 0) {
                            await setDoc(userDocRef, updates, { merge: true });
                        }
                        if (userData.nickname) {
                            setHasNickname(true);
                            setScreen('home');
                        }
                    } else {
                        // New user, initialize document
                        await setDoc(userDocRef, {
                            friends: [],
                            friendRequestsSent: [],
                            friendRequestsReceived: [],
                        });
                    }
                }
            } catch (err) {
                console.error('Error checking user:', err);
            } finally {
                setIsCheckingNickname(false);
            }
        };
        checkUser();
    }, [setScreen]);

    const handleSignIn = async () => {
        try {
            setError(null);
            setIsCheckingNickname(true);
            const signedInUser = await signInWithApple();
            setUser(signedInUser);
            const userDocRef = doc(db, 'users', signedInUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Initialize required fields if they don't exist
                const updates = {};
                if (!userData.friends) updates.friends = [];
                if (!userData.friendRequestsSent) updates.friendsRequestsSent = [];
                if (!userData.friendRequestsReceived) updates.friendRequestsReceived = [];
                if (Object.keys(updates).length > 0) {
                    await setDoc(userDocRef, updates, { merge: true });
                }
                if (userData.nickname) {
                    setHasNickname(true);
                    setScreen('home');
                }
            } else {
                // New user, initialize document
                await setDoc(userDocRef, {
                    friends: [],
                    friendRequestsSent: [],
                    friendRequestsReceived: [],
                });
            }
        } catch (error) {
            setError('Failed to sign in with Apple. Please try again.');
            console.error('Sign-in error:', error);
        } finally {
            setIsCheckingNickname(false);
        }
    };

    if (isCheckingNickname) {
        return <LoadingScreen />;
    }

    if (!user) {
        return (
            <div className="auth-container">
                <h1 className="auth-heading flex items-center">
                    memeow
                    <span className="ml-2 text-gradient-violet">~</span>
                </h1>
                <button
                    onClick={handleSignIn}
                    className="auth-button"
                >
                    <span className="mr-2"></span> Sign in with Apple
                </button>
                {error && (
                    <p className="text-red-500 mt-4 text-center max-w-xs">{error}</p>
                )}
            </div>
        );
    }

    if (hasNickname) {
        setScreen('home');
        return null;
    }

    return <NicknameSelection user={user} setScreen={setScreen} />;
}

export default AuthHandler;