import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';

function SearchScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [requestSent, setRequestSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const nicknameDoc = await getDoc(doc(db, 'nicknames', searchTerm));
            if (nicknameDoc.exists()) {
                const userId = nicknameDoc.data().uid;
                const userDoc = await getDoc(doc(db, 'users', userId));
                setSearchResult({ id: userId, ...userDoc.data() });
            } else {
                setSearchResult(null);
            }
            setRequestSent(false);
        } catch (err) {
            console.error('Error searching for user:', err);
            setError('Failed to search. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const sendFriendRequest = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            await addDoc(collection(db, 'friendRequestsSent'), {
                from: currentUser.uid,
                to: searchResult.id,
                createdAt: new Date(),
            });
            setRequestSent(true);
        } catch (err) {
            console.error('Error sending friend request:', err);
            setError('Failed to send friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const addFriend = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friends: arrayUnion(searchResult.id),
            });
            await updateDoc(doc(db, 'users', searchResult.id), {
                friends: arrayUnion(currentUser.uid),
            });
            setRequestSent(false);
        } catch (err) {
            console.error('Error adding friend:', err);
            setError('Failed to add friend. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black">
                <p className="text-red-500 text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-4 safe-area-inset-top min-h-screen bg-black">
            <motion.h1
                className="text-4xl font-bold mb-6 text-center"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                memeow <span className="text-blue-400">〜</span>
            </motion.h1>
            <motion.div
                className="w-full max-w-md bg-[#1a1a1a] p-4 rounded-xl border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-[#1a1a1a] text-white px-4 py-2 rounded-xl text-center no-resize border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search by nickname"
                    />
                    <motion.button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-4 py-2 rounded-xl font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Search
                    </motion.button>
                </div>
            </motion.div>
            <div className="w-full max-w-md flex-grow mt-4 max-h-[60vh] overflow-y-auto">
                <AnimatePresence>
                    {searchResult && (
                        <motion.div
                            className="bg-[#1a1a1a] p-4 rounded-xl border-4 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <p className="text-base text-center">{searchResult.nickname}</p>
                            {!requestSent ? (
                                <motion.button
                                    onClick={sendFriendRequest}
                                    className="bg-gradient-to-r from-blue-500 to-blue-400 text-white px-4 py-2 rounded-xl mt-2 w-full font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Send Friend Request
                                </motion.button>
                            ) : (
                                <motion.button
                                    onClick={addFriend}
                                    className="bg-green-500 text-white px-4 py-2 rounded-xl mt-2 w-full font-medium"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Request Sent - Add Friend
                                </motion.button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default SearchScreen;