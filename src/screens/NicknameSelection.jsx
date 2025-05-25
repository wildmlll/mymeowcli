import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import LoadingScreen from './LoadingScreen';

function NicknameSelection({ user, setScreen }) {
    const [nickname, setNickname] = useState('');
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

    const saveNickname = async () => {
        if (isAvailable) {
            try {
                setIsChecking(true);
                setError(null);
                await setDoc(doc(db, 'nicknames', nickname), { uid: user.uid });
                await setDoc(doc(db, 'users', user.uid), { nickname }, { merge: true });
                setScreen('home');
            } catch (err) {
                console.error('Error saving nickname:', err);
                setError('Failed to save nickname. Please try again.');
                setIsChecking(false);
            }
        }
    };

    if (isChecking) {
        return <LoadingScreen />;
    }

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
                <motion.button
                    onClick={saveNickname}
                    className="nickname-button nickname-button-success mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    Save Nickname
                </motion.button>
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