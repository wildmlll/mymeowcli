// src/screens/NicknameSelection.jsx
import { useState } from 'react';
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
            <h1 className="nickname-heading">Choose Nickname</h1>
            <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="nickname-input no-resize"
                placeholder="Enter nickname"
            />
            <button
                onClick={checkNickname}
                className={`nickname-button nickname-button-primary mt-4 ${
                    (isChecking || !nickname) && 'nickname-button-disabled'
                }`}
                disabled={isChecking || !nickname}
            >
                {isChecking ? 'Checking...' : 'Check Nickname'}
            </button>
            {isAvailable === false && (
                <button
                    className="nickname-button nickname-button-disabled mt-3"
                    disabled
                >
                    Nickname Taken
                </button>
            )}
            {isAvailable === true && (
                <button
                    onClick={saveNickname}
                    className="nickname-button nickname-button-success mt-3"
                >
                    Save Nickname
                </button>
            )}
            {error && (
                <p className="text-red-500 mt-4 text-center">{error}</p>
            )}
        </div>
    );
}

export default NicknameSelection;