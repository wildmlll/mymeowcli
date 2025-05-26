import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';

function FriendsListScreen({ setSelectedUserId, setScreen }) {
    const [friendsList, setFriendsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                setIsLoading(true);
                const user = await getCurrentUser();
                if (!user) throw new Error('User not authenticated');
                setCurrentUser(user);

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (!userDoc.exists()) throw new Error('User data not found');
                const userData = userDoc.data();
                const friends = userData.friends || [];

                const friendsDetails = await Promise.all(
                    friends.map(async (friendId) => {
                        const friendDoc = await getDoc(doc(db, 'users', friendId));
                        return friendDoc.exists() ? { id: friendId, ...friendDoc.data() } : null;
                    })
                );
                setFriendsList(friendsDetails.filter(Boolean));
            } catch (err) {
                console.error('Error fetching friends list:', err);
                setError('Failed to load friends list. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFriends();
    }, []);

    const viewProfile = (userId) => {
        if (userId === currentUser.uid) {
            setScreen三级('profile');
        } else {
            setSelectedUserId(userId);
            setScreen('userProfile');
        }
    };

    if (isLoading) return <LoadingScreen />;
    if (error) return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black">
            <p className="text-red-500 text-center">{error}</p>
        </div>
    );

    return (
        <div className="flex flex-col items-center p-4 safe-area-inset-top min-h-screen bg-black">
            <motion.h1
                className="text-4xl font-bold mb-6 text-center"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                Friends List <span className="text-blue-400">〜</span>
            </motion.h1>
            <motion.div
                className="w-full max-w-md bg-[#1a1a1a] p-4 rounded-xl border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <AnimatePresence>
                    {friendsList.length > 0 ? (
                        friendsList.map(friend => (
                            <motion.div
                                key={friend.id}
                                className="flex items-center p-2 bg-[#2a2a2a] rounded-xl mb-2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {friend.avatarUrl && (
                                    <img
                                        src={friend.avatarUrl}
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full mr-2"
                                    />
                                )}
                                <p
                                    className="text-base cursor-pointer"
                                    onClick={() => viewProfile(friend.id)}
                                >
                                    {friend.nickname}
                                </p>
                            </motion.div>
                        ))
                    ) : (
                        <motion.p
                            className="text-gray-400 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            No friends yet
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>
            <motion.button
                onClick={() => setScreen('profile')}
                className="mt-4 bg-gray-700 text-white px-6 py-2 rounded-xl font-medium"
                whileHover={{ scale: 1.05 }}
                g               whileTap={{ scale: 0.95 }}
            >
                Back to Profile
            </motion.button>
        </div>
    );
}

export default FriendsListScreen;