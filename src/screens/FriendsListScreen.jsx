import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';
import { IoArrowBack } from 'react-icons/io5';

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
            setScreen('profile');
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
        <div className="flex flex-col items-center p-4 safe-area-inset-top min-h-screen bg-black pt-0">
            <motion.div
                className="fixed top-0 left-0 w-full bg-black z-10 pt-16"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                <div className="relative flex items-center justify-center">
                    <IoArrowBack
                        className="text-2xl text-white absolute left-16 top-1/2 transform -translate-y-1/2 cursor-pointer"
                        onClick={() => setScreen('home')}
                    />
                    <h1 className="text-4xl font-bold text-center">
                        myfriends <span className="text-blue-400">〜</span>
                    </h1>
                </div>
            </motion.div>
            <motion.div
                className="w-full max-w-md p-4 pt-15"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <AnimatePresence>
                    {friendsList.length > 0 ? (
                        friendsList.map(friend => (
                            <motion.div
                                key={friend.id}
                                className="border-2 border-gray-600 p-2 rounded-xl mb-2 flex items-center"
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
        </div>
    );
}

export default FriendsListScreen;