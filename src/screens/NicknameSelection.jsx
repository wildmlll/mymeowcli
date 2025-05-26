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

                // Check network status
                const networkStatus = await Network.getStatus();
                if (!networkStatus.connected) {
                    throw new Error('No internet connection. Please check your network.');
                }

                // Verify authentication
                const currentUser = await getCurrentUser();
                if (!currentUser) throw new Error('User not authenticated.');
                console.log('Authenticated user UID:', currentUser.uid); // Debug log for auth

                const avatarRef = ref(storage, `avatars/${currentUser.uid}/profile.jpg`);
                console.log('Starting upload for user:', currentUser.uid); // Debug log
                const fileData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsArrayBuffer(avatar);
                });
                console.log('FileData length:', fileData.byteLength, 'Type:', avatar.type); // Debug log
                const blob = new Blob([fileData], { type: avatar.type });
                console.log('Blob size:', blob.size); // Debug log
                console.log('Uploading to:', avatarRef.fullPath); // Debug log
                const uploadTask = uploadBytes(avatarRef, blob);
                console.log('Upload task initiated'); // Debug log
                await uploadTask;
                console.log('Upload completed'); // Debug log
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
                console.error('Error saving nickname and avatar:', err, { file: avatar, fileDataLength: avatar ? avatar.size : null });
                setError(`Failed to save nickname and avatar. ${err.message}. Check Firebase Storage rules or contact support if persistent.`);
                setIsChecking(false);
            }
        }
    };

    if (isChecking) return <LoadingScreen />;

    return (
        <div className="nickname-container">
            <motion.h1
                className="nickname-heading"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                Choose Nickname <span className="text-blue-400">〜</span>
            </motion.h1>
            <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="nickname-input no-resize"
                placeholder="Enter nickname"
            />
            <motion.button
                onClick={checkNickname}
                className={`nickname-button nickname-button-primary mt-4 ${
                    (isChecking || !nickname) && 'nickname-button-disabled'
                }`}
                disabled={isChecking || !nickname}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isChecking ? 'Checking...' : 'Check Nickname'}
            </motion.button>
            {isAvailable === false && (
                <motion.button
                    className="nickname-button nickname-button-disabled mt-3"
                    disabled
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    Nickname Taken
                </motion.button>
            )}
            {isAvailable === true && (
                <div>
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
                        className="mt-4"
                    />
                    <motion.button
                        onClick={saveNicknameAndAvatar}
                        className="nickname-button nickname-button-success mt-3"
                        disabled={!avatar}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        Save Nickname and Avatar
                    </motion.button>
                </div>
            )}
            {error && (
                <motion.p
                    className="text-red-500 mt-4 text-center"
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