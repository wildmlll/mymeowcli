import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getCurrentUser } from '../services/auth';
import LoadingScreen from './LoadingScreen';

function UserProfileScreen({ userId, setScreen }) {
    const [userData, setUserData] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [relationshipStatus, setRelationshipStatus] = useState('none'); // 'none', 'sent', 'received', 'friends'
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true);
                const user = await getCurrentUser();
                setCurrentUser(user);

                const userDoc = await getDoc(doc(db, 'users', userId));
                if (!userDoc.exists()) throw new Error('User not found');
                setUserData(userDoc.data());

                // Check relationship status
                const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
                const currentUserData = currentUserDoc.data();
                if (currentUserData.friends?.includes(userId)) {
                    setRelationshipStatus('friends');
                } else if (currentUserData.friendRequestsSent?.includes(userId)) {
                    setRelationshipStatus('sent');
                } else if (currentUserData.friendRequestsReceived?.includes(userId)) {
                    setRelationshipStatus('received');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user profile. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [userId]);

    const sendFriendRequest = async () => {
        try {
            setIsLoading(true);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friendRequestsSent: arrayUnion(userId),
            });
            await updateDoc(doc(db, 'users', userId), {
                friendRequestsReceived: arrayUnion(currentUser.uid),
            });
            setRelationshipStatus('sent');
        } catch (err) {
            console.error('Error sending friend request:', err);
            setError('Failed to send friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const acceptFriendRequest = async () => {
        try {
            setIsLoading(true);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                friends: arrayUnion(userId),
                friendRequestsReceived: arrayRemove(userId),
            });
            await updateDoc(doc(db, 'users', userId), {
                friends: arrayUnion(currentUser.uid),
                friendRequestsSent: arrayRemove(currentUser.uid),
            });
            setRelationshipStatus('friends');
        } catch (err) {
            console.error('Error accepting friend request:', err);
            setError('Failed to accept friend request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingScreen />;
    if (error) return <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black"><p className="text-red-500 text-center">{error}</p></div>;

    return (
        <div className="flex flex-col items-center p-4 safe-area-inset-top min-h-screen bg-black">
            <motion.h1
                className="text-4xl font-bold mb-6 text-center"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                {userData.nickname}'s Profile
            </motion.h1>
            <motion.div
                className="w-full max-w-md bg-[#1a1a1a] p-4 rounded-xl border-4 border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div className="flex items-center justify-center mb-4">
                    {userData.avatarUrl && <img src={userData.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full mr-4" />}
                    <p className="text-xl font-semibold text-center">{userData.nickname}</p>
                </div>
                {relationshipStatus === 'none' && (
                    <motion.button
                        onClick={sendFriendRequest}
                        className="bg-gradient-to-r from-blue-500 to-blue-400 text-white px-6 py-2 rounded-xl w-full font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Send Friend Request
                    </motion.button>
                )}
                {relationshipStatus === 'sent' && (
                    <motion.button
                        className="bg-gray-500 text-white px-6 py-2 rounded-xl w-full font-medium opacity-50 cursor-not-allowed"
                        disabled
                    >
                        Request Sent
                    </motion.button>
                )}
                {relationshipStatus === 'received' && (
                    <motion.button
                        onClick={acceptFriendRequest}
                        className="bg-green-500 text-white px-6 py-2 rounded-xl w-full font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Accept Request
                    </motion.button>
                )}
                {relationshipStatus === 'friends' && (
                    <motion.button
                        className="bg-green-500 text-white px-6 py-2 rounded-xl w-full font-medium opacity-50 cursor-not-allowed"
                        disabled
                    >
                        Friends
                    </motion.button>
                )}
            </motion.div>
            <motion.button
                onClick={() => setScreen('friends')}
                className="mt-4 bg-gray-700 text-white px-6 py-2 rounded-xl font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Back to Friends
            </motion.button>
        </div>
    );
}

export default UserProfileScreen;