import { useState } from 'react';
import { motion } from 'framer-motion';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Network } from '@capacitor/network';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';

function NicknameSelection({ user, setScreen }) {
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState(null);
    const [error, setError] = useState(null);

    const checkNickname = async () => {
        try {
            setIsChecking(true);
            setError(null);
            const nicknameDoc = await getDoc(doc(db, 'nicknames', nickname));
            setIsAvailable(!nicknameDoc.exists());
        } catch (err) {
            console.error('Error checking nickname:', err);
            setError('Failed to check nickname. Please try again.');
        } finally {
            setIsChecking(false);
        }
    };

    const saveNicknameAndAvatar = async () => {
        if (isAvailable && avatar) {
            try {
                setIsChecking(true);
                setError(null);

                const networkStatus = await Network.getStatus();
                if (!networkStatus.connected) {
                    throw new Error('No internet connection. Please check your network.');
                }

                const currentUser = await getCurrentUser();
                if (!currentUser) throw new Error('User not authenticated.');

                const avatarRef = ref(storage, `avatars/${currentUser.uid}/profile.jpg`);
                const fileData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsArrayBuffer(avatar);
                });
                const blob = new Blob([fileData], { type: avatar.type });
                await uploadBytes(avatarRef, blob);
                const avatarUrl = await getDownloadURL(avatarRef);
                await setDoc(doc(db, 'nicknames', nickname), { uid: currentUser.uid });
                await setDoc(doc(db, 'users', currentUser.uid), {
                    nickname,
                    avatarUrl,
                    friends: [],
                    friendRequestsReceived: [],
                    friendRequestsSent: []
                }, { merge: true });
                setScreen('home');
            } catch (err) {
                console.error('Error saving nickname and avatar:', err);
                setError(`Failed to save nickname and avatar. ${err.message}. Check Firebase Storage rules or contact support if persistent.`);
            } finally {
                setIsChecking(false);
            }
        }
    };

    if (isChecking) return <LoadingScreen />;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black pt-8">
            <motion.h1
                className="text-4xl font-bold mb-6 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                mymeow <span className="text-blue-400">〜</span>
            </motion.h1>
            <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full max-w-md p-2 mb-4 rounded-xl bg-[#1a1a1a] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter nickname"
            />
            <motion.button
                onClick={checkNickname}
                className="w-full max-w-md bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-2 rounded-xl font-medium mb-4"
                disabled={isChecking || !nickname}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isChecking ? 'Checking...' : 'Check Nickname'}
            </motion.button>
            {isAvailable === false && (
                <motion.p
                    className="text-red-500 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    Nickname Taken
                </motion.p>
            )}
            {isAvailable === true && (
                <div className="mt-4 flex flex-col items-center">
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/heif,image/heic"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && file.type.match(/image\/(jpeg|png|heif|heic)/)) {
                                setAvatar(file);
                                setError(null);
                            } else {
                                setAvatar(null);
                                setError('Please select a valid image file (JPEG, PNG, HEIC, HEIF).');
                            }
                        }}
                        className="hidden"
                        id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload" className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-white cursor-pointer mb-4">
                        {avatar ? '✓' : 'Upload Avatar'}
                    </label>
                    <motion.button
                        onClick={saveNicknameAndAvatar}
                        className="w-full max-w-md bg-gradient-to-r from-green-500 to-green-400 text-white px-6 py-2 rounded-xl font-medium"
                        disabled={!avatar}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Save Nickname and Avatar
                    </motion.button>
                </div>
            )}
            {error && (
                <motion.p
                    className="text-red-500 mt-2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}

export default NicknameSelection;