import { useEffect, useState } from 'react';
import {signInWithApple, getCurrentUser, signInWithGoogle} from '../services/auth';
import NicknameSelection from './NicknameSelection';
import LoadingScreen from './LoadingScreen';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import GoogleIcon from '../assets/google-icon-logo-svgrepo-com.svg';

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

    const handleSignInA = async () => {
        try {
            setError(null);
            setIsCheckingNickname(true);
            const signedInUser = await signInWithApple();
            setUser(signedInUser);
            const userDocRef = doc(db, 'users', signedInUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
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

    const handleSignInG = async () => {
        try {
            setError(null);
            setIsCheckingNickname(true);
            const signedInUser = await  signInWithGoogle();
            setUser(signedInUser);
            const userDocRef = doc(db, 'users', signedInUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
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
            <div className="auth-container mt-2">
                <h1 className="auth-heading flex items-center">
                    mymeow
                    <span className=" ml-2 text-blue-400">〜</span>
                </h1>
                <button
                    onClick={handleSignInA}
                    className="auth-buttona pt-2"
                >
                    <span className="mr-2"></span> Sign in with Apple
                </button>
                <div className="w-[30%] h-0.5 bg-gradient-to-r from-blue-600 to-violet-600 my-4"></div>
                <button
                    onClick={handleSignInG}
                    className="auth-buttong pt-2"
                >
                    <img src={GoogleIcon} alt="Google" className="inline-block mr-2 h-3 w-3" />
                    Sign in with Google
                </button>
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